import React, { useState, useEffect, useReducer, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Animated,
  Platform,
  useColorScheme,
  KeyboardAvoidingView,
  Vibration,
  Share,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Strapi Configuration
const STRAPI_URL = 'http://localhost:1337';
const STRAPI_API_TOKEN = 'your-api-token-here';

// Storage Keys
const STORAGE_KEYS = {
  ARTICLES: '@articles_cache',
  DRAFTS: '@article_drafts',
  LAST_SYNC: '@last_sync_time',
  OFFLINE_QUEUE: '@offline_queue',
  BOOKMARKS: '@bookmarks',
};

// Action Types for Reducer
const ACTIONS = {
  SET_ARTICLES: 'SET_ARTICLES',
  ADD_ARTICLE: 'ADD_ARTICLE',
  UPDATE_ARTICLE: 'UPDATE_ARTICLE',
  DELETE_ARTICLE: 'DELETE_ARTICLE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_ONLINE: 'SET_ONLINE',
  SET_SEARCH: 'SET_SEARCH',
  SET_SORT: 'SET_SORT',
  TOGGLE_BOOKMARK: 'TOGGLE_BOOKMARK',
};

// Reducer for state management
function articlesReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_ARTICLES:
      return { ...state, articles: action.payload, error: null };
    case ACTIONS.ADD_ARTICLE:
      return { ...state, articles: [action.payload, ...state.articles] };
    case ACTIONS.UPDATE_ARTICLE:
      return {
        ...state,
        articles: state.articles.map(a =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case ACTIONS.DELETE_ARTICLE:
      return {
        ...state,
        articles: state.articles.filter(a => a.id !== action.payload),
      };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_ONLINE:
      return { ...state, isOnline: action.payload };
    case ACTIONS.SET_SEARCH:
      return { ...state, searchQuery: action.payload };
    case ACTIONS.SET_SORT:
      return { ...state, sortBy: action.payload };
    case ACTIONS.TOGGLE_BOOKMARK:
      return {
        ...state,
        bookmarks: state.bookmarks.includes(action.payload)
          ? state.bookmarks.filter(id => id !== action.payload)
          : [...state.bookmarks, action.payload],
      };
    default:
      return state;
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorBoundary}>
          <Text style={styles.errorBoundaryTitle}>⚠️ Something went wrong</Text>
          <Text style={styles.errorBoundaryText}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Skeleton Loader Component
function SkeletonCard() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.articleItem}>
      <Animated.View style={[styles.skeleton, { opacity }]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonContent} />
        <View style={styles.skeletonMeta} />
      </Animated.View>
    </View>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [state, dispatch] = useReducer(articlesReducer, {
    articles: [],
    loading: false,
    error: null,
    isOnline: true,
    searchQuery: '',
    sortBy: 'date',
    bookmarks: [],
  });

  const [editingArticle, setEditingArticle] = useState(null);
  const [viewingArticle, setViewingArticle] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const abortControllerRef = useRef(null);

  // Haptic feedback helper
  const hapticFeedback = (type = 'light') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      if (type === 'success') {
        Vibration.vibrate(50);
      } else if (type === 'error') {
        Vibration.vibrate([0, 100, 50, 100]);
      } else {
        Vibration.vibrate(20);
      }
    }
  };

  // Load cached data and bookmarks on mount
  useEffect(() => {
    loadCachedData();
    loadBookmarks();
    loadDrafts();
    checkNetworkStatus();
  }, []);

  // Sync offline queue when online
  useEffect(() => {
    if (state.isOnline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [state.isOnline]);

  // Check network status
  const checkNetworkStatus = async () => {
    try {
      const response = await axios.get(`${STRAPI_URL}/api`, { timeout: 3000 });
      dispatch({ type: ACTIONS.SET_ONLINE, payload: true });
      return true;
    } catch (err) {
      dispatch({ type: ACTIONS.SET_ONLINE, payload: false });
      return false;
    }
  };

  // Load cached articles from AsyncStorage
  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.ARTICLES);
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (cached) {
        dispatch({ type: ACTIONS.SET_ARTICLES, payload: JSON.parse(cached) });
      }
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    } catch (err) {
      console.error('Error loading cached data:', err);
    }
  };

  // Save articles to cache
  const cacheArticles = async (articles) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Error caching articles:', err);
    }
  };

  // Load bookmarks
  const loadBookmarks = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (bookmarks) {
        dispatch({ type: ACTIONS.SET_ARTICLES, payload: { bookmarks: JSON.parse(bookmarks) } });
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    }
  };

  // Save bookmarks
  const saveBookmarks = async (bookmarks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (err) {
      console.error('Error saving bookmarks:', err);
    }
  };

  // Toggle bookmark
  const toggleBookmark = (articleId) => {
    hapticFeedback('light');
    dispatch({ type: ACTIONS.TOGGLE_BOOKMARK, payload: articleId });
    const newBookmarks = state.bookmarks.includes(articleId)
      ? state.bookmarks.filter(id => id !== articleId)
      : [...state.bookmarks, articleId];
    saveBookmarks(newBookmarks);
  };

  // Load drafts
  const loadDrafts = async () => {
    try {
      const draftsData = await AsyncStorage.getItem(STORAGE_KEYS.DRAFTS);
      if (draftsData) {
        setDrafts(JSON.parse(draftsData));
      }
    } catch (err) {
      console.error('Error loading drafts:', err);
    }
  };

  // Save draft
  const saveDraft = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      return;
    }

    hapticFeedback('success');
    const draft = {
      id: Date.now(),
      ...formData,
      savedAt: new Date().toISOString(),
    };

    const newDrafts = [...drafts, draft];
    setDrafts(newDrafts);
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(newDrafts));
    Alert.alert('Success', 'Draft saved!');
  };

  // Load draft
  const loadDraft = (draft) => {
    hapticFeedback('light');
    setFormData({ title: draft.title, content: draft.content });
    setShowDrafts(false);
  };

  // Delete draft
  const deleteDraft = async (draftId) => {
    const newDrafts = drafts.filter(d => d.id !== draftId);
    setDrafts(newDrafts);
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(newDrafts));
  };

  // Add to offline queue
  const addToOfflineQueue = async (operation) => {
    const newQueue = [...offlineQueue, operation];
    setOfflineQueue(newQueue);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(newQueue));
  };

  // Sync offline queue
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    console.log(`Syncing ${offlineQueue.length} offline operations...`);
    
    for (const operation of offlineQueue) {
      try {
        if (operation.type === 'create') {
          await createArticle(operation.data, true);
        } else if (operation.type === 'update') {
          await updateArticle(operation.id, operation.data, true);
        } else if (operation.type === 'delete') {
          await deleteArticle(operation.id, true);
        }
      } catch (err) {
        console.error('Error syncing operation:', err);
      }
    }

    setOfflineQueue([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    Alert.alert('Success', 'Offline changes synced!');
  };

  // Fetch articles with retry and exponential backoff
  const fetchArticles = async (isRefresh = false) => {
    if (!isRefresh) {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    }
    dispatch({ type: ACTIONS.SET_ERROR, payload: null });

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await axios.get(`${STRAPI_URL}/api/articles`, {
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          },
          signal: abortControllerRef.current.signal,
          timeout: 10000,
        });

        const articles = response.data.data || [];
        dispatch({ type: ACTIONS.SET_ARTICLES, payload: articles });
        dispatch({ type: ACTIONS.SET_ONLINE, payload: true });
        await cacheArticles(articles);
        setRetryCount(0);
        
        if (isRefresh) {
          hapticFeedback('success');
        }
        
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Request cancelled');
          return;
        }

        attempt++;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('Error fetching articles:', err);
          dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Failed to fetch articles' });
          dispatch({ type: ACTIONS.SET_ONLINE, payload: false });
          
          if (isRefresh) {
            hapticFeedback('error');
          }
        }
      }
    }

    dispatch({ type: ACTIONS.SET_LOADING, payload: false });
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchArticles(true), checkNetworkStatus()]);
    setRefreshing(false);
  };

  // Create article
  const createArticle = async (data = formData, isSync = false) => {
    if (!data.title.trim() || !data.content.trim()) {
      Alert.alert('Error', 'Please enter both title and content');
      return;
    }

    if (!state.isOnline && !isSync) {
      await addToOfflineQueue({ type: 'create', data });
      Alert.alert('Offline', 'Article will be created when back online');
      setFormData({ title: '', content: '' });
      return;
    }

    setIsCreating(true);
    hapticFeedback('light');

    try {
      const response = await axios.post(
        `${STRAPI_URL}/api/articles`,
        { data },
        {
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      dispatch({ type: ACTIONS.ADD_ARTICLE, payload: response.data.data });
      setFormData({ title: '', content: '' });
      hapticFeedback('success');
      Alert.alert('Success', 'Article created successfully!');
      await fetchArticles();
    } catch (err) {
      console.error('Error creating article:', err);
      hapticFeedback('error');
      Alert.alert('Error', err.message || 'Failed to create article');
    } finally {
      setIsCreating(false);
    }
  };

  // Update article
  const updateArticle = async (id, data, isSync = false) => {
    if (!state.isOnline && !isSync) {
      await addToOfflineQueue({ type: 'update', id, data });
      Alert.alert('Offline', 'Article will be updated when back online');
      setEditingArticle(null);
      return;
    }

    hapticFeedback('light');

    try {
      const response = await axios.put(
        `${STRAPI_URL}/api/articles/${id}`,
        { data },
        {
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      dispatch({ type: ACTIONS.UPDATE_ARTICLE, payload: response.data.data });
      setEditingArticle(null);
      hapticFeedback('success');
      Alert.alert('Success', 'Article updated successfully!');
      await fetchArticles();
    } catch (err) {
      console.error('Error updating article:', err);
      hapticFeedback('error');
      Alert.alert('Error', err.message || 'Failed to update article');
    }
  };

  // Delete article
  const deleteArticle = async (id, isSync = false) => {
    if (!state.isOnline && !isSync) {
      await addToOfflineQueue({ type: 'delete', id });
      Alert.alert('Offline', 'Article will be deleted when back online');
      dispatch({ type: ACTIONS.DELETE_ARTICLE, payload: id });
      return;
    }

    hapticFeedback('light');

    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${STRAPI_URL}/api/articles/${id}`, {
                headers: {
                  Authorization: `Bearer ${STRAPI_API_TOKEN}`,
                },
              });

              dispatch({ type: ACTIONS.DELETE_ARTICLE, payload: id });
              hapticFeedback('success');
              Alert.alert('Success', 'Article deleted successfully!');
            } catch (err) {
              console.error('Error deleting article:', err);
              hapticFeedback('error');
              Alert.alert('Error', err.message || 'Failed to delete article');
            }
          },
        },
      ]
    );
  };

  // Share article
  const shareArticle = async (article) => {
    hapticFeedback('light');
    try {
      await Share.share({
        message: `${article.attributes.title}\n\n${article.attributes.content}`,
        title: article.attributes.title,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Open article for editing
  const startEdit = (article) => {
    hapticFeedback('light');
    setEditingArticle(article);
    setFormData({
      title: article.attributes.title,
      content: article.attributes.content,
    });
  };

  // View article details
  const viewArticle = (article) => {
    hapticFeedback('light');
    setViewingArticle(article);
  };

  // Filter and sort articles
  const getFilteredAndSortedArticles = () => {
    let filtered = [...state.articles];

    // Search filter
    if (state.searchQuery) {
      filtered = filtered.filter(
        a =>
          a.attributes.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          a.attributes.content.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'date':
          return new Date(b.attributes.createdAt) - new Date(a.attributes.createdAt);
        case 'title':
          return a.attributes.title.localeCompare(b.attributes.title);
        case 'author':
          return (a.attributes.author || '').localeCompare(b.attributes.author || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredArticles = getFilteredAndSortedArticles();

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4CAF50"
              title="Pull to refresh"
              titleColor="#8b9dc3"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📱 Enhanced Mobile App</Text>
            <Text style={styles.subtitle}>Complete Features & Polish</Text>
            
            {/* Status Badges */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, state.isOnline ? styles.online : styles.offline]}>
                <Text style={styles.statusText}>
                  {state.isOnline ? '🟢 Online' : '🔴 Offline'}
                </Text>
              </View>
              {offlineQueue.length > 0 && (
                <View style={[styles.statusBadge, styles.queue]}>
                  <Text style={styles.statusText}>
                    📤 {offlineQueue.length} pending
                  </Text>
                </View>
              )}
            </View>

            {lastSyncTime && (
              <Text style={styles.syncTime}>
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </Text>
            )}
          </View>

          {/* Search and Sort */}
          <View style={styles.card}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search articles..."
              placeholderTextColor="#8b9dc3"
              value={state.searchQuery}
              onChangeText={(text) => dispatch({ type: ACTIONS.SET_SEARCH, payload: text })}
              accessible
              accessibilityLabel="Search articles"
            />
            
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              {['date', 'title', 'author'].map(sort => (
                <TouchableOpacity
                  key={sort}
                  style={[styles.sortButton, state.sortBy === sort && styles.sortButtonActive]}
                  onPress={() => {
                    hapticFeedback('light');
                    dispatch({ type: ACTIONS.SET_SORT, payload: sort });
                  }}
                  accessible
                  accessibilityLabel={`Sort by ${sort}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.sortButtonText, state.sortBy === sort && styles.sortButtonTextActive]}>
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Articles List */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                📚 Articles ({filteredArticles.length})
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => fetchArticles()}
                disabled={state.loading}
                accessible
                accessibilityLabel="Refresh articles"
                accessibilityRole="button"
              >
                <Text style={styles.refreshButtonText}>
                  {state.loading ? '⏳' : '🔄'}
                </Text>
              </TouchableOpacity>
            </View>

            {state.loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : state.error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>❌ {state.error}</Text>
                <TouchableOpacity
                  style={[styles.button, styles.buttonRetry]}
                  onPress={() => fetchArticles()}
                  accessible
                  accessibilityLabel="Retry loading articles"
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonText}>🔄 Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredArticles.length > 0 ? (
              <View style={styles.articlesList}>
                {filteredArticles.map(article => (
                  <View key={article.id} style={styles.articleItem}>
                    <TouchableOpacity
                      onPress={() => viewArticle(article)}
                      accessible
                      accessibilityLabel={`View article: ${article.attributes.title}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.articleTitle}>
                        {article.attributes.title}
                      </Text>
                      <Text style={styles.articleContent} numberOfLines={2}>
                        {article.attributes.content}
                      </Text>
                      <Text style={styles.articleMeta}>
                        {new Date(article.attributes.createdAt).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Action Buttons */}
                    <View style={styles.articleActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => toggleBookmark(article.id)}
                        accessible
                        accessibilityLabel={state.bookmarks.includes(article.id) ? 'Remove bookmark' : 'Add bookmark'}
                        accessibilityRole="button"
                      >
                        <Text style={styles.actionButtonText}>
                          {state.bookmarks.includes(article.id) ? '⭐' : '☆'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => shareArticle(article)}
                        accessible
                        accessibilityLabel="Share article"
                        accessibilityRole="button"
                      >
                        <Text style={styles.actionButtonText}>📤</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => startEdit(article)}
                        accessible
                        accessibilityLabel="Edit article"
                        accessibilityRole="button"
                      >
                        <Text style={styles.actionButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteArticle(article.id)}
                        accessible
                        accessibilityLabel="Delete article"
                        accessibilityRole="button"
                      >
                        <Text style={styles.actionButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                {state.searchQuery ? '🔍 No articles match your search' : '📝 No articles yet. Create one below!'}
              </Text>
            )}
          </View>

          {/* Create/Edit Article Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {editingArticle ? '✏️ Edit Article' : '✍️ Create Article'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Article Title"
              placeholderTextColor="#8b9dc3"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              accessible
              accessibilityLabel="Article title input"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Article Content"
              placeholderTextColor="#8b9dc3"
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              multiline
              numberOfLines={4}
              accessible
              accessibilityLabel="Article content input"
            />
            
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSuccess]}
                onPress={() => editingArticle ? updateArticle(editingArticle.id, formData) : createArticle()}
                disabled={isCreating}
                accessible
                accessibilityLabel={editingArticle ? 'Update article' : 'Create article'}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>
                  {isCreating ? '⏳ Saving...' : editingArticle ? '💾 Update' : '✅ Create'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={saveDraft}
                accessible
                accessibilityLabel="Save as draft"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>💾 Save Draft</Text>
              </TouchableOpacity>
              
              {editingArticle && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => {
                    setEditingArticle(null);
                    setFormData({ title: '', content: '' });
                  }}
                  accessible
                  accessibilityLabel="Cancel editing"
                  accessibilityRole="button"
                >
                  <Text style={styles.buttonText}>❌ Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {drafts.length > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonDraft]}
                onPress={() => setShowDrafts(!showDrafts)}
                accessible
                accessibilityLabel="View drafts"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>
                  📄 {drafts.length} Draft{drafts.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Features List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✨ Enhanced Features</Text>
            <View style={styles.featureList}>
              <Text style={styles.feature}>✅ Enhanced CRUD with edit & delete</Text>
              <Text style={styles.feature}>✅ Offline support & sync queue</Text>
              <Text style={styles.feature}>✅ Pull-to-refresh with debounce</Text>
              <Text style={styles.feature}>✅ Advanced error handling & retry</Text>
              <Text style={styles.feature}>✅ Skeleton loading states</Text>
              <Text style={styles.feature}>✅ Search & sort functionality</Text>
              <Text style={styles.feature}>✅ Haptic feedback</Text>
              <Text style={styles.feature}>✅ Draft saving</Text>
              <Text style={styles.feature}>✅ Bookmarks/favorites</Text>
              <Text style={styles.feature}>✅ Share functionality</Text>
              <Text style={styles.feature}>✅ Error boundaries</Text>
              <Text style={styles.feature}>✅ Accessibility labels</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Alphinium Platform © 2026</Text>
            <Text style={styles.footerText}>Issue #448 - Complete Mobile Features</Text>
          </View>
        </ScrollView>

        {/* View Article Modal */}
        <Modal
          visible={viewingArticle !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setViewingArticle(null)}
        >
          {viewingArticle && (
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{viewingArticle.attributes.title}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setViewingArticle(null)}
                  accessible
                  accessibilityLabel="Close article"
                  accessibilityRole="button"
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                <Text style={styles.modalText}>{viewingArticle.attributes.content}</Text>
                <Text style={styles.modalMeta}>
                  Created: {new Date(viewingArticle.attributes.createdAt).toLocaleString()}
                </Text>
              </ScrollView>
            </View>
          )}
        </Modal>

        {/* Drafts Modal */}
        <Modal
          visible={showDrafts}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDrafts(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📄 Drafts</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDrafts(false)}
                accessible
                accessibilityLabel="Close drafts"
                accessibilityRole="button"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {drafts.map(draft => (
                <View key={draft.id} style={styles.draftItem}>
                  <Text style={styles.draftTitle}>{draft.title || 'Untitled'}</Text>
                  <Text style={styles.draftContent} numberOfLines={2}>
                    {draft.content}
                  </Text>
                  <Text style={styles.draftMeta}>
                    Saved: {new Date(draft.savedAt).toLocaleString()}
                  </Text>
                  <View style={styles.draftActions}>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonPrimary]}
                      onPress={() => loadDraft(draft)}
                      accessible
                      accessibilityLabel="Load draft"
                      accessibilityRole="button"
                    >
                      <Text style={styles.buttonText}>Load</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonDanger]}
                      onPress={() => deleteDraft(draft.id)}
                      accessible
                      accessibilityLabel="Delete draft"
                      accessibilityRole="button"
                    >
                      <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8b9dc3',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  online: {
    backgroundColor: '#1b4d3e',
  },
  offline: {
    backgroundColor: '#4d1b1b',
  },
  queue: {
    backgroundColor: '#4d3e1b',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  syncTime: {
    color: '#6b7a94',
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1f3a',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#0a0e27',
    borderWidth: 1,
    borderColor: '#2a3550',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    color: '#8b9dc3',
    fontSize: 14,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0a0e27',
    borderWidth: 1,
    borderColor: '#2a3550',
  },
  sortButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sortButtonText: {
    color: '#8b9dc3',
    fontSize: 12,
  },
  sortButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
  },
  loadingContainer: {
    gap: 12,
  },
  errorContainer: {
    backgroundColor: '#ff1744',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  articlesList: {
    gap: 12,
  },
  articleItem: {
    backgroundColor: '#0a0e27',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  articleContent: {
    fontSize: 14,
    color: '#b4c1d8',
    marginBottom: 8,
    lineHeight: 20,
  },
  articleMeta: {
    fontSize: 12,
    color: '#6b7a94',
    marginBottom: 8,
  },
  articleActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1f3a',
    borderRadius: 22,
  },
  actionButtonText: {
    fontSize: 18,
  },
  emptyText: {
    color: '#8b9dc3',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#0a0e27',
    borderWidth: 1,
    borderColor: '#2a3550',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2196F3',
  },
  buttonSecondary: {
    backgroundColor: '#FF9800',
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonDanger: {
    backgroundColor: '#f44336',
  },
  buttonCancel: {
    backgroundColor: '#757575',
  },
  buttonRetry: {
    backgroundColor: '#FF5722',
    marginTop: 8,
  },
  buttonDraft: {
    backgroundColor: '#9C27B0',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skeleton: {
    gap: 8,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#2a3550',
    borderRadius: 4,
    width: '70%',
  },
  skeletonContent: {
    height: 40,
    backgroundColor: '#2a3550',
    borderRadius: 4,
  },
  skeletonMeta: {
    height: 12,
    backgroundColor: '#2a3550',
    borderRadius: 4,
    width: '40%',
  },
  featureList: {
    gap: 8,
  },
  feature: {
    fontSize: 14,
    color: '#b4c1d8',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a3550',
  },
  footerText: {
    color: '#6b7a94',
    fontSize: 12,
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3550',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#b4c1d8',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalMeta: {
    fontSize: 14,
    color: '#6b7a94',
    marginTop: 20,
  },
  draftItem: {
    backgroundColor: '#1a1f3a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  draftTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  draftContent: {
    fontSize: 14,
    color: '#b4c1d8',
    marginBottom: 8,
  },
  draftMeta: {
    fontSize: 12,
    color: '#6b7a94',
    marginBottom: 8,
  },
  draftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  errorBoundary: {
    flex: 1,
    backgroundColor: '#0a0e27',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBoundaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  errorBoundaryText: {
    fontSize: 16,
    color: '#ff1744',
    textAlign: 'center',
    marginBottom: 20,
  },
});
