import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Asset } from 'expo-asset';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Image 
        source={require('../data/logoVector_ablute.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      <Text style={styles.text}>ablute_©</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#000000',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  logo: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  text: {
    fontFamily: 'Comfortaa-Bold',
    color: 'white',
    fontSize: 11,
  },
}); 