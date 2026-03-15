import { View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>WeatherApp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // IMPORTANT
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: 'white', fontSize: 32, fontWeight: 'bold' }
});