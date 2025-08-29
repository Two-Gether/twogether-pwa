import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SvgIcon from './icons/Icon';

import MainScreen from '../../features/main/screens/MainScreen';
import MapScreen from '../../features/map/screens/MapScreen';
import EventScreen from '../../features/event/screens/EventScreen';
import CalendarScreen from '../../features/calendar/screens/CalendarScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const BottomTabBar = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#FF6B81',
                tabBarInactiveTintColor: '#767676',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    paddingBottom: 20,
                    paddingTop: 5,
                    height: 80,
                },
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Main"
                component={MainScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ color, size }) => (
                        <SvgIcon name="home" width={size} height={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Map"
                component={MapScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ color, size }) => (
                        <SvgIcon name="map" width={size} height={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Event"
                component={EventScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ color, size }) => (
                        <SvgIcon name="place" width={size} height={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Calendar"
                component={CalendarScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ color, size }) => (
                        <SvgIcon name="calendar" width={size} height={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ color, size }) => (
                        <SvgIcon name="my" width={size} height={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabBar; 