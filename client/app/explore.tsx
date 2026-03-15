import { View, Text, StyleSheet } from 'react-native';

export default function Explore() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Explore Screen Content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    // This ensures the screen doesn't "paint" over your mountain image
    backgroundColor: 'transparent', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  text: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold',
    // Adding a slight shadow helps text stand out against the stars
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10 
  }
});