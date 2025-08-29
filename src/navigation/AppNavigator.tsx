import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../features/auth/screens/LoginScreen';
import SignupScreen from '../features/auth/screens/SignupScreen';
import BottomTabBar from '../shared/components/BottomTabBar';

// 네비게이션 타입 정의
type RootStackParamList = {
    Login: undefined;
    Signup: undefined;
    MainApp: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator(); // This Tab is for BottomTabBar, not used directly here anymore

const AppNavigator = () => {
    return (
        // @ts-ignore - React Navigation TypeScript issue
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="MainApp" component={BottomTabBar} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;