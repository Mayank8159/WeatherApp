import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, useWindowDimensions, ScrollView, Pressable, type ViewStyle } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cloud, CloudRain, Snowflake, Sun } from 'lucide-react-native';
import * as Location from 'expo-location';

type ConditionType = 'sunny' | 'rainy' | 'cloudy' | 'snowy';

type HourlyForecastItem = { time: string; temp: string; condition: ConditionType };
type WeeklyForecastItem = { day: string; avgTemp: string; avgCondition: ConditionType };

type WeatherUiState = {
  city: string;
  currentTemp: string;
  conditionLabel: string;
  highLow: string;
  compact: string;
  humidity: string;
  wind: string;
  rainChance: string;
  sunrise: string;
  hourly: HourlyForecastItem[];
  weekly: WeeklyForecastItem[];
};

const DEFAULT_STATE: WeatherUiState = {
  city: 'Montreal',
  currentTemp: '19°',
  conditionLabel: 'Mostly Clear',
  highLow: 'H:24°  L:18°',
  compact: '19° | Mostly Clear',
  humidity: '--%',
  wind: '-- km/h',
  rainChance: '--%',
  sunrise: '--:--',
  hourly: [
    { time: 'Now', temp: '19°', condition: 'cloudy' },
    { time: '1 AM', temp: '18°', condition: 'rainy' },
    { time: '2 AM', temp: '17°', condition: 'cloudy' },
    { time: '3 AM', temp: '17°', condition: 'snowy' },
    { time: '4 AM', temp: '16°', condition: 'sunny' },
    { time: '5 AM', temp: '16°', condition: 'sunny' },
  ],
  weekly: [
    { day: 'Mon', avgTemp: '18°', avgCondition: 'cloudy' },
    { day: 'Tue', avgTemp: '16°', avgCondition: 'rainy' },
    { day: 'Wed', avgTemp: '15°', avgCondition: 'snowy' },
    { day: 'Thu', avgTemp: '20°', avgCondition: 'sunny' },
    { day: 'Fri', avgTemp: '19°', avgCondition: 'cloudy' },
    { day: 'Sat', avgTemp: '17°', avgCondition: 'rainy' },
    { day: 'Sun', avgTemp: '21°', avgCondition: 'sunny' },
  ],
};

export default function WeatherApp() {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<'hourly' | 'weekly'>('hourly');
  const [weather, setWeather] = React.useState<WeatherUiState>(DEFAULT_STATE);
  
  const translateY = useSharedValue(0);
  const context = useSharedValue(0);

  // Align the Hourly/Weekly row with where the house image starts.
  const HOUSE_TOP = SCREEN_HEIGHT * 0.25;
  const HOUSE_HEIGHT = 350;
  const HOUSE_BOTTOM = HOUSE_TOP + HOUSE_HEIGHT;
  const TAB_HEADER_START_OFFSET = 53;
  const COLLAPSED_TOP = HOUSE_BOTTOM - TAB_HEADER_START_OFFSET;
  const EXPANDED_TOP = insets.top + 84;
  const SNAP_POINT_UP = EXPANDED_TOP - COLLAPSED_TOP;
  const SNAP_POINT_DOWN = 0;

  const gesture = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value;
      translateY.value = Math.max(translateY.value, SNAP_POINT_UP);
      translateY.value = Math.min(translateY.value, SNAP_POINT_DOWN);
    })
    .onEnd(() => {
      if (translateY.value < SNAP_POINT_UP * 0.38) {
        translateY.value = withSpring(SNAP_POINT_UP, { damping: 16, stiffness: 280, mass: 0.55 });
      } else {
        translateY.value = withSpring(SNAP_POINT_DOWN, { damping: 16, stiffness: 280, mass: 0.55 });
      }
    });

  // --- ANIMATED STYLES ---

  // 1. Header Shrink Logic
  const animatedHeaderStyle = useAnimatedStyle<ViewStyle>(() => {
    // City Name Scale
    const scale = interpolate(translateY.value, [0, SNAP_POINT_UP], [1, 0.7], Extrapolation.CLAMP);
    // City Name Y-Translation (keep it from hitting the status bar)
    const transY = interpolate(translateY.value, [0, SNAP_POINT_UP], [0, insets.top - 20], Extrapolation.CLAMP);
    
    return {
      transform: [{ scale }, { translateY: transY }],
    };
  });

  // 2. Temperature Fade Logic (Fades out the big numbers)
  const animatedDetailsStyle = useAnimatedStyle<ViewStyle>(() => {
    const opacity = interpolate(translateY.value, [0, SNAP_POINT_UP * 0.4], [1, 0], Extrapolation.CLAMP);
    const translateYSub = interpolate(translateY.value, [0, SNAP_POINT_UP * 0.4], [0, -20], Extrapolation.CLAMP);
    
    return { 
      opacity,
      transform: [{ translateY: translateYSub }]
    };
  });

  // 3. Compact Header (Only shows "19° | Mostly Clear" when swiped up)
  const animatedCompactStyle = useAnimatedStyle<ViewStyle>(() => {
    const opacity = interpolate(translateY.value, [SNAP_POINT_UP * 0.6, SNAP_POINT_UP], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  // 4. House and Forecast Sheet Styles
  const animatedHouseStyle = useAnimatedStyle<ViewStyle>(() => ({
    opacity: interpolate(translateY.value, [0, SNAP_POINT_UP * 0.5], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateY.value, [0, SNAP_POINT_UP], [1, 0.8], Extrapolation.CLAMP) }]
  }));

  const animatedSheetStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        let latitude = 45.5017;
        let longitude = -73.5673;

        if (permission.status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise&timezone=auto`;

        const weatherRes = await fetch(weatherUrl);
        const weatherJson = await weatherRes.json();

        let city = DEFAULT_STATE.city;
        const devicePlace = await Location.reverseGeocodeAsync({ latitude, longitude });
        const primaryPlace = devicePlace?.[0];

        if (primaryPlace) {
          city =
            primaryPlace.city ||
            primaryPlace.subregion ||
            primaryPlace.region ||
            primaryPlace.district ||
            DEFAULT_STATE.city;
        } else {
          const reverseRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&count=1`
          );
          const reverseJson = await reverseRes.json();
          const place = reverseJson?.results?.[0];
          city = place?.name || DEFAULT_STATE.city;
        }

        const current = weatherJson?.current ?? {};
        const daily = weatherJson?.daily ?? {};
        const hourly = weatherJson?.hourly ?? {};

        const conditionInfo = getConditionFromCode(current?.weather_code ?? 0);

        const max0 = daily?.temperature_2m_max?.[0];
        const min0 = daily?.temperature_2m_min?.[0];
        const highLow =
          typeof max0 === 'number' && typeof min0 === 'number'
            ? `H:${Math.round(max0)}°  L:${Math.round(min0)}°`
            : DEFAULT_STATE.highLow;

        const hourlyTime: string[] = hourly?.time ?? [];
        const hourlyTemp: number[] = hourly?.temperature_2m ?? [];
        const hourlyCode: number[] = hourly?.weather_code ?? [];
        const hourlyRain: number[] = hourly?.precipitation_probability ?? [];

        const now = Date.now();
        const startIndex = Math.max(
          0,
          hourlyTime.findIndex((t) => new Date(t).getTime() >= now)
        );

        const hourlyItems: HourlyForecastItem[] = [];
        for (let i = 0; i < 6; i += 1) {
          const idx = startIndex + i;
          if (!hourlyTime[idx]) break;

          const label = i === 0 ? 'Now' : new Date(hourlyTime[idx]).toLocaleTimeString([], { hour: 'numeric' });
          const temp = typeof hourlyTemp[idx] === 'number' ? `${Math.round(hourlyTemp[idx])}°` : '--°';
          const condition = getConditionFromCode(hourlyCode[idx]).type;
          hourlyItems.push({ time: label, temp, condition });
        }

        const dailyTime: string[] = daily?.time ?? [];
        const dailyMax: number[] = daily?.temperature_2m_max ?? [];
        const dailyMin: number[] = daily?.temperature_2m_min ?? [];
        const dailyCode: number[] = daily?.weather_code ?? [];

        const weeklyItems: WeeklyForecastItem[] = dailyTime.slice(0, 7).map((day, idx) => {
          const avg = typeof dailyMax[idx] === 'number' && typeof dailyMin[idx] === 'number'
            ? `${Math.round((dailyMax[idx] + dailyMin[idx]) / 2)}°`
            : '--°';
          const avgCondition = getConditionFromCode(dailyCode[idx]).type;
          const dayLabel = new Date(day).toLocaleDateString('en-US', { weekday: 'short' });
          return { day: dayLabel, avgTemp: avg, avgCondition };
        });

        const rainSubset = hourlyRain.slice(startIndex, startIndex + 6).filter((v) => typeof v === 'number');
        const avgRain = rainSubset.length
          ? `${Math.round(rainSubset.reduce((acc, n) => acc + n, 0) / rainSubset.length)}%`
          : DEFAULT_STATE.rainChance;

        const sunrise = daily?.sunrise?.[0]
          ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : DEFAULT_STATE.sunrise;

        const currentTemp = typeof current?.temperature_2m === 'number'
          ? `${Math.round(current.temperature_2m)}°`
          : DEFAULT_STATE.currentTemp;

        const compact = `${currentTemp} | ${conditionInfo.label}`;

        const nextState: WeatherUiState = {
          city,
          currentTemp,
          conditionLabel: conditionInfo.label,
          highLow,
          compact,
          humidity:
            typeof current?.relative_humidity_2m === 'number'
              ? `${Math.round(current.relative_humidity_2m)}%`
              : DEFAULT_STATE.humidity,
          wind:
            typeof current?.wind_speed_10m === 'number'
              ? `${Math.round(current.wind_speed_10m)} km/h`
              : DEFAULT_STATE.wind,
          rainChance: avgRain,
          sunrise,
          hourly: hourlyItems.length ? hourlyItems : DEFAULT_STATE.hourly,
          weekly: weeklyItems.length ? weeklyItems : DEFAULT_STATE.weekly,
        };

        if (!cancelled) {
          setWeather(nextState);
        }
      } catch {
        // Keep fallback values when API/location fails.
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Background is handled in _layout.tsx usually, but keeping logic here */}
        <View style={StyleSheet.absoluteFill} />

        {/* --- HEADER --- */}
        <View style={[styles.headerWrapper, { paddingTop: insets.top + 20 }]}>
          <Animated.View style={[styles.center, animatedHeaderStyle]}>
            <Text style={styles.city}>{weather.city}</Text>
          </Animated.View>

          {/* Big Details (Hidden when scrolled up) */}
          <Animated.View style={[styles.center, animatedDetailsStyle]}>
            <Text style={styles.bigTemp}>{weather.currentTemp}</Text>
            <Text style={styles.condition}>{weather.conditionLabel}</Text>
            <Text style={styles.highLow}>{weather.highLow}</Text>
          </Animated.View>

          {/* Compact Details (Shown when scrolled up) */}
          <Animated.View style={[styles.compactRow, animatedCompactStyle]}>
            <Text style={styles.compactText}>{weather.compact}</Text>
          </Animated.View>
        </View>

        {/* --- HOUSE --- */}
        <Animated.View style={[styles.houseContainer, { top: HOUSE_TOP }, animatedHouseStyle]}>
          <Image 
            source={require('../assets/House.png')} 
            style={styles.house} 
            resizeMode="contain" 
          />
        </Animated.View>

        {/* --- SLIDING SHEET --- */}
        <Animated.View style={[styles.sheet, { top: COLLAPSED_TOP }, animatedSheetStyle]}>
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={['rgba(46, 42, 114, 0.9)', 'rgba(30, 30, 70, 0.98)']}
                style={StyleSheet.absoluteFillObject}
              />

              <GestureDetector gesture={gesture}>
                <View style={styles.handleArea}>
                  <View style={styles.handle} />
                </View>
              </GestureDetector>

              <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
                {/* Hourly / Weekly tabs */}
                <View style={styles.tabHeader}>
                  <Pressable onPress={() => setActiveTab('hourly')} style={styles.tabButton}>
                    <Text style={activeTab === 'hourly' ? styles.tabTextActive : styles.tabText}>Hourly Forecast</Text>
                  </Pressable>
                  <Pressable onPress={() => setActiveTab('weekly')} style={styles.tabButton}>
                    <Text style={activeTab === 'weekly' ? styles.tabTextActive : styles.tabText}>Weekly Forecast</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.forecastList}
                >
                  {activeTab === 'hourly'
                    ? weather.hourly.map((item) => (
                        <View key={item.time} style={styles.forecastItem}>
                          <Text style={styles.forecastTime}>{item.time}</Text>
                          <View style={styles.forecastIconWrap}>{getConditionIcon(item.condition, 22)}</View>
                          <Text style={styles.forecastTemp}>{item.temp}</Text>
                        </View>
                      ))
                    : weather.weekly.map((item) => (
                        <View key={item.day} style={styles.forecastItemWeekly}>
                          <Text style={styles.forecastDay}>{item.day}</Text>
                          <View style={styles.forecastIconWrap}>{getConditionIcon(item.avgCondition, 22)}</View>
                          <Text style={styles.forecastCondition}>{capitalize(item.avgCondition)}</Text>
                          <Text style={styles.forecastTemp}>{item.avgTemp} avg</Text>
                        </View>
                      ))}
                </ScrollView>

                {/* Grid Components matching Screenshot 233156 */}
                <View style={styles.grid}>
                   <MetricCard label="HUMIDITY" value={weather.humidity} />
                   <View style={styles.row}>
                     <MetricCard label="WIND" value={weather.wind} half />
                     <MetricCard label="SUNRISE" value={weather.sunrise} half />
                   </View>
                   <View style={styles.row}>
                     <MetricCard label="RAINFALL" value={weather.rainChance} half />
                     <MetricCard label="CONDITION" value={weather.conditionLabel} half />
                   </View>
                </View>
              </ScrollView>
            </BlurView>
          </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
}

function MetricCard({ label, value, half }: any) {
  return (
    <View style={[styles.card, half && { flex: 1 }]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

function getConditionIcon(condition: ConditionType, size = 18) {
  if (condition === 'sunny') return <Sun color="#FFD76A" size={size} />;
  if (condition === 'rainy') return <CloudRain color="#89B8FF" size={size} />;
  if (condition === 'snowy') return <Snowflake color="#BEEBFF" size={size} />;
  return <Cloud color="#D7D9F2" size={size} />;
}

function getConditionFromCode(code: number): { type: ConditionType; label: string } {
  if (code === 0) return { type: 'sunny', label: 'Clear Sky' };
  if ([1, 2].includes(code)) return { type: 'cloudy', label: 'Partly Cloudy' };
  if ([3, 45, 48].includes(code)) return { type: 'cloudy', label: 'Cloudy' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { type: 'snowy', label: 'Snow' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return { type: 'rainy', label: 'Rainy' };
  }
  return { type: 'cloudy', label: 'Cloudy' };
}

function capitalize(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  headerWrapper: { alignItems: 'center', position: 'absolute', width: '100%', zIndex: 10 },
  center: { alignItems: 'center' },
  city: { fontSize: 34, color: 'white', fontWeight: '400' },
  bigTemp: { fontSize: 96, color: 'white', fontWeight: '200', lineHeight: 100 },
  condition: { fontSize: 20, color: 'rgba(235, 235, 245, 0.6)', fontWeight: '600' },
  highLow: { fontSize: 20, color: 'white', fontWeight: '500' },
  compactRow: { position: 'absolute', bottom: -25 },
  compactText: { color: 'rgba(235, 235, 245, 0.6)', fontSize: 20, fontWeight: '600' },
  houseContainer: { position: 'absolute', alignSelf: 'center', zIndex: 1 },
  house: { width: 350, height: 350 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '100%',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    overflow: 'hidden',
    zIndex: 20,
  },
  handleArea: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: { width: 48, height: 5, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 2.5, alignSelf: 'center', marginTop: 10 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 26, marginTop: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255, 255, 255, 0.1)', paddingBottom: 10 },
  tabButton: { paddingHorizontal: 6, paddingVertical: 2 },
  tabTextActive: { color: 'white', fontSize: 15, fontWeight: '600' },
  tabText: { color: 'rgba(235, 235, 245, 0.6)', fontSize: 15, fontWeight: '600' },
  forecastList: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 14,
    paddingBottom: 4,
  },
  forecastItem: {
    width: 82,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  forecastItemWeekly: {
    width: 108,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  forecastIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  forecastTime: {
    color: 'rgba(235,235,245,0.86)',
    fontSize: 12,
    fontWeight: '600',
  },
  forecastDay: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  forecastTemp: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  forecastCondition: {
    color: 'rgba(235,235,245,0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  grid: { padding: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  cardLabel: { color: 'rgba(235, 235, 245, 0.6)', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  cardValue: { color: 'white', fontSize: 22, fontWeight: '500' }
});