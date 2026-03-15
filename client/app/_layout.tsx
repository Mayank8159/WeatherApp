import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, ImageBackground, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Plus, MapPin, List } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// 1. Custom Tab Bar Component
function CustomTabBar({ state, navigation }: any) {
  return (
    <View style={styles.tabContainer}>
      <Svg width={width} height={80} viewBox={`0 0 ${width} 80`} style={styles.svg}>
        <Path
          fill="#2E2A72" 
          d={`M0 25 
              C${width * 0.2} 25, ${width * 0.3} 0, ${width * 0.5} 0 
              S${width * 0.8} 25, ${width} 25 
              V80 H0 Z`}
        />
      </Svg>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('index')} style={styles.button}>
          <MapPin color="white" size={26} opacity={state.index === 0 ? 1 : 0.5} />
        </TouchableOpacity>

        <View style={styles.fabWrapper}>
          <TouchableOpacity activeOpacity={0.8} style={styles.fab}>
            <Plus color="#2E2A72" size={32} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('explore')} style={styles.button}>
          <List color="white" size={26} opacity={state.index === 1 ? 1 : 0.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 2. Main Layout with Background
export default function TabLayout() {
  return (
    <ImageBackground 
      source={require('../assets/image.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <Tabs 
        tabBar={(props: any) => <CustomTabBar {...props} />} 
        screenOptions={{ 
          headerShown: false,
          tabBarShowLabel: false,
          sceneStyle: { backgroundColor: 'transparent' } // Makes screens see-through
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
      </Tabs>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  tabContainer: { position: 'absolute', bottom: 0, width: '100%', height: 80 },
  svg: { position: 'absolute', bottom: 0 },
  buttonsContainer: { flexDirection: 'row', height: 80, alignItems: 'center', justifyContent: 'space-around', paddingBottom: 10 },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: {
    top: -25,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  }
});