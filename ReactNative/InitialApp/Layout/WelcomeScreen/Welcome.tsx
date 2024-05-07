import React from 'react';

import {
  SafeAreaView,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigate } from 'react-router-native';

function WelcomeScreen(): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <SafeAreaView style={styles.safeAreaStyle}>
      <ImageBackground
        source={require('../../assets/splash/splash_background.png')} // Specify the image source
        style={styles.imageBackground}
        resizeMode="cover">
        <View style={styles.imgContainer}>
          <Image
            source={require('../../assets/auth/auth.png')} // Specify the image source
            style={{width: 300, height: 300}}
          />
        </View>
        <View style={styles.container}>
          <Text style={styles.titleStyle}>Let's get started</Text>
          <Text style={{color: '#EFEFEF', paddingHorizontal: 10}}>
            Login to your account below or signup for an amazing experience
          </Text>
        </View>
        {/* buttons for account creation or login */}
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <View
            style={{
              width: '80%',
              flexDirection: 'column',
              gap: 20,
              justifyContent: 'space-between',
              paddingVertical: 20,
            }}>
            <TouchableWithoutFeedback onPress={() => {
              console.log('Create Account');
              navigate('/signup');
            }}>
              <View
                style={{
                  width: '100%',
                  height: 55,
                  backgroundColor: 'white',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 28,
                }}>
                <Text style={{color: 'black', fontWeight: 'bold'}}>
                  Create Account
                </Text>
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={() => {
              navigate('/login');
            }}>
              <View
                style={{
                  width: '100%',
                  height: 55,
                  backgroundColor: '#2E71DC',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 28,
                }}>
                <Text style={{color: 'white', fontWeight: 'bold'}}>Login</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
          {/* By logging in or registering, you have agreed to the Terms and Conditions and Privacy Policy. */}
          <Text
            style={{
              color: '#EFEFEFAF',
              paddingHorizontal: 50,
              textAlign: 'center',
            }}>
            By logging in or registering, you have agreed to
            <Text style={{color: '#FFFFFF'}}> the Terms and Conditions </Text>
            and <Text style={{color: '#FFFFFF'}}> Privacy Policy </Text> .
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaStyle: {
    flex: 1,
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover', // or 'stretch' or 'center'
  },
  imgContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  container: {
    paddingHorizontal: 40,
  },
  titleStyle: {
    fontSize: 50,
    fontWeight: 'bold',
    color: 'white', // Text color on top of the background image
    fontFamily: 'Sen',
    // paddingHorizontal: 40,
  },
});

export default WelcomeScreen;
