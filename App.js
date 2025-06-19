import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SpeciesLogScreen from './src/screens/SpeciesLogScreen';
import HistoryScreen from './src/screens/HistoryScreen';

import {getToken, clearToken} from './src/utils/storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({onLogout}) {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: true,
        headerRight: () => (
          <Icon
            name="logout"
            size={24}
            color="gray"
            style={{marginRight: 15}}
            onPress={async () => {
              await clearToken();
              onLogout();
            }}
          />
        ),
        tabBarIcon: ({color, size}) => {
          let iconName;

          if (route.name === 'Home') {iconName = 'home';}
          else if (route.name === 'Log Species') {iconName = 'add-circle';}
          else if (route.name === 'History') {iconName = 'history';}

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Log Species" component={SpeciesLogScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // prevent flicker

  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken();
      setIsLoggedIn(!!token);
      setLoading(false);
    };

    checkToken();
  }, []);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {isLoggedIn ? (
          <Stack.Screen name="MainTabs">
            {props => (
              <MainTabs {...props} onLogout={() => setIsLoggedIn(false)} />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login">
            {props => (
              <LoginScreen
                {...props}
                onLogin={() => setIsLoggedIn(true)} // called after login
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
