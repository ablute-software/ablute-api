import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';

const LOADING_TIMEOUT = 30000; // 30 seconds timeout
const MAP_URL = 'https://www.google.com/maps/d/u/0/edit?mid=1VWxrwQIcG2CA2ri9iElJ0iIEuPMbQIs&usp=sharing';

export default function MapScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0); // Used to force WebView refresh

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
        Alert.alert(
          'Map Loading Error',
          'The map is taking too long to load. Please check your internet connection and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: handleRetry }
          ]
        );
      }, LOADING_TIMEOUT);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setKey(prevKey => prevKey + 1); // Force WebView to reload
  };

  const openInBrowser = async () => {
    try {
      await Linking.openURL(MAP_URL);
    } catch (error) {
      console.error('Error opening map in browser:', error);
      Alert.alert(
        'Error',
        'Failed to open map in browser. Please try again later.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Ablute_ Locations</Text>
        <View style={styles.headerActions}>
          {hasError && (
            <TouchableOpacity onPress={handleRetry} style={styles.headerButton}>
              <RefreshCw size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openInBrowser} style={styles.headerButton}>
            <ExternalLink size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.mapContainer}>
        {isLoading && !hasError && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        
        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load map</Text>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButtonLarge}>
              <RefreshCw size={24} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openInBrowser} style={styles.browserButton}>
              <ExternalLink size={24} color="#FFFFFF" />
              <Text style={styles.browserButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            key={key}
            source={{ uri: MAP_URL }}
            style={styles.map}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="always"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#111111',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 20,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 10,
    marginLeft: 5,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    paddingBottom: 60,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
    zIndex: 1,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
  },
  retryButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
  },
  browserButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});