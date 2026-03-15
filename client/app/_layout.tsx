import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useWindowDimensions, StatusBar as RNStatusBar } from 'react-native';
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { Sun, Moon, MapPin, List } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

const TransparentTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: 'transparent',
        card: 'transparent',
    },
};

const TAB_BAR_HEIGHT = 80;

function CustomTabBar({ state, navigation }: any) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [hour, setHour] = React.useState(new Date().getHours());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setHour(new Date().getHours());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const isDay = hour >= 6 && hour < 18;
    const H = TAB_BAR_HEIGHT + insets.bottom;
    const cx = width / 2;
    const dip = 28;

    const curve = `M0 ${dip} C${width * 0.18} ${dip}, ${width * 0.28} 0, ${cx} 0 S${width * 0.82} ${dip}, ${width} ${dip} V${H} H0 Z`;
    const curveEdge = `M0 ${dip} C${width * 0.18} ${dip}, ${width * 0.28} 0, ${cx} 0 S${width * 0.82} ${dip}, ${width} ${dip}`;

    return (
        <View style={[styles.tabContainer, { height: H }]}>
            <Svg
                width={width}
                height={H}
                viewBox={`0 0 ${width} ${H}`}
                style={StyleSheet.absoluteFillObject}
            >
                <Defs>
                    {/* Deep indigo/purple tinted glass base */}
                    <LinearGradient id="glassTint" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#1e1b4b" stopOpacity="0.55" />
                        <Stop offset="0.5" stopColor="#312e81" stopOpacity="0.65" />
                        <Stop offset="1" stopColor="#1e1b4b" stopOpacity="0.8" />
                    </LinearGradient>

                    {/* White shimmer — top to bottom fade */}
                    <LinearGradient id="shine" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
                        <Stop offset="0.3" stopColor="#ffffff" stopOpacity="0.07" />
                        <Stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
                    </LinearGradient>

                    {/* Violet radial glow at the center FAB dip */}
                    <RadialGradient id="centerGlow" cx={cx} cy="8" rx={width * 0.28} ry="55" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#a78bfa" stopOpacity="0.45" />
                        <Stop offset="0.6" stopColor="#6d28d9" stopOpacity="0.1" />
                        <Stop offset="1" stopColor="#6d28d9" stopOpacity="0" />
                    </RadialGradient>

                    {/* Left side orb glow */}
                    <RadialGradient id="leftOrb" cx={width * 0.18} cy={H * 0.55} rx={width * 0.18} ry={H * 0.45} gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#818cf8" stopOpacity="0.25" />
                        <Stop offset="1" stopColor="#818cf8" stopOpacity="0" />
                    </RadialGradient>

                    {/* Right side orb glow */}
                    <RadialGradient id="rightOrb" cx={width * 0.82} cy={H * 0.55} rx={width * 0.18} ry={H * 0.45} gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#818cf8" stopOpacity="0.25" />
                        <Stop offset="1" stopColor="#818cf8" stopOpacity="0" />
                    </RadialGradient>

                    {/* Top rim highlight gradient — left-center-right shimmer */}
                    <LinearGradient id="rimGrad" x1="0" y1="0" x2={width} y2="0" gradientUnits="userSpaceOnUse">
                        <Stop offset="0" stopColor="#c4b5fd" stopOpacity="0.5" />
                        <Stop offset="0.3" stopColor="#ffffff" stopOpacity="0.9" />
                        <Stop offset="0.5" stopColor="#ddd6fe" stopOpacity="0.55" />
                        <Stop offset="0.7" stopColor="#ffffff" stopOpacity="0.9" />
                        <Stop offset="1" stopColor="#c4b5fd" stopOpacity="0.5" />
                    </LinearGradient>
                </Defs>

                {/* Layer 1: Tinted glass base */}
                <Path d={curve} fill="url(#glassTint)" />
                {/* Layer 2: White top shimmer */}
                <Path d={curve} fill="url(#shine)" />
                {/* Layer 3: Center violet glow */}
                <Path d={curve} fill="url(#centerGlow)" />
                {/* Layer 4: Left & right orb glows */}
                <Path d={curve} fill="url(#leftOrb)" />
                <Path d={curve} fill="url(#rightOrb)" />
                {/* Layer 5: Top rim specular highlight */}
                <Path d={curveEdge} fill="none" stroke="url(#rimGrad)" strokeWidth="1.5" />
                {/* Layer 6: Bottom edge subtle line */}
                <Path d={`M0 ${H} H${width}`} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            </Svg>

            <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom }]}>
                {/* Left icon */}
                <TouchableOpacity onPress={() => navigation.navigate('index')} style={styles.button}>
                    {state.index === 0 && <View style={styles.activeGlow} />}
                    <MapPin color="white" size={24} opacity={state.index === 0 ? 1 : 0.45} />
                </TouchableOpacity>

                {/* FAB — liquid glass circle */}
                <View style={styles.fabWrapper}>
                    <TouchableOpacity activeOpacity={0.75} style={styles.fab}>
                        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
                        <View style={styles.fabInnerGlass} />
                        <View style={[styles.logoGlow, isDay ? styles.sunGlow : styles.moonGlow]} />
                        {isDay ? (
                            <Sun color="#FFD76A" size={24} strokeWidth={2.3} />
                        ) : (
                            <Moon color="#DDE6FF" size={22} strokeWidth={2.3} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Right icon */}
                <TouchableOpacity onPress={() => navigation.navigate('explore')} style={styles.button}>
                    {state.index === 1 && <View style={styles.activeGlow} />}
                    <List color="white" size={24} opacity={state.index === 1 ? 1 : 0.45} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function TabLayout() {
    const { width, height } = useWindowDimensions();
    const statusBarHeight = RNStatusBar.currentHeight ?? 0;

    return (
        <ThemeProvider value={TransparentTheme}>
            <View style={styles.container}>
                <StatusBar style="light" translucent />

                <Image
                    source={require('../assets/image.png')}
                    style={[
                        styles.backgroundImage,
                        { width: width + 40, height: height + statusBarHeight + 120, top: -statusBarHeight - 60 },
                    ]}
                    resizeMode="cover"
                />

                <Tabs
                    tabBar={(props) => <CustomTabBar {...props} />}
                    screenOptions={{
                        headerShown: false,
                        tabBarShowLabel: false,
                        sceneStyle: { backgroundColor: 'transparent' },
                        tabBarStyle: styles.hiddenDefaultTabBar,
                    }}
                >
                    <Tabs.Screen name="index" />
                    <Tabs.Screen name="explore" />
                </Tabs>
            </View>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a2e',
    },
    backgroundImage: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    hiddenDefaultTabBar: {
        position: 'absolute',
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
    },
    tabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    buttonsContainer: {
        flexDirection: 'row',
        height: TAB_BAR_HEIGHT,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeGlow: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(167, 139, 250, 0.18)',
    },
    fabWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        top: -22,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        shadowColor: '#a78bfa',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 12,
    },
    fabInnerGlass: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 30,
    },
    logoGlow: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    sunGlow: {
        backgroundColor: 'rgba(255, 215, 106, 0.22)',
    },
    moonGlow: {
        backgroundColor: 'rgba(178, 201, 255, 0.22)',
    },
});