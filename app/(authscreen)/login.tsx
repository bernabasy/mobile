import ButtonComponent from '@/components/custom/CustomButton';
import CustomText from '@/components/custom/CustomText';
import { Colors } from '@/constants/Colors';
import i18n from '@/i18n';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {loginService} from '../../services/authServices'
import {
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import CustomLink from '@/components/custom/CustomLink';

const { width } = Dimensions.get('screen');



const styles = StyleSheet.create({
  textInput: {
    marginBottom: 10,
    backgroundColor: 'rgba(3, 252, 182,0.2)',
    fontSize: 18,
    color: '#000',
  },
  circle: {
    width: width *0.8,
    height: width*0.8 ,
    borderRadius: width / 2,
    backgroundColor: Colors.dark.primary,
    position: 'absolute',
    top: width / 4,
    opacity: 0.2,
    zIndex: -1,
  },
  link: {
    fontSize: 18,
    alignSelf: 'center',
    color: 'blue',
  },
  errorMessage: {
    color: 'red',
    fontSize: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 50,
  },
  flag: {
    fontSize: 20,
    marginRight: 5,
  },
  countryCode: {
    fontSize: 16,
    color: '#000',
    marginRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
});

const Login = () => {
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorSignal, setErrorSignal] = useState({
    phoneNumber: false,
    invalidFormat: false, // Add a new state for format validation error
  });


  const handleLogin = () => {
    // Basic validation: Check if empty
    if (!phoneNumber) {
      setErrorSignal({ phoneNumber: true, invalidFormat: false });
      return; // Stop execution if empty
    }

    // Ethiopian phone number format validation (starts with 9, 9 digits long)
    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setErrorSignal({ phoneNumber: false, invalidFormat: true });
      return; // Stop execution if format is invalid
    }

    // If validation passes, navigate
    setErrorSignal({ phoneNumber: false, invalidFormat: false }); // Clear errors
    router.push({pathname: '/(authscreen)/pinInput', params: {mobile: phoneNumber}})
  };

  const handlePhoneNumberChange = (text: string) => {
    // Allow only digits and limit length if needed (optional)
    const numericText = text.replace(/[^0-9]/g, '');
    setPhoneNumber(numericText);
    // Clear errors when user types
    setErrorSignal({ phoneNumber: false, invalidFormat: false });
  };

  return (
    <SafeAreaView>
      <ScrollView>
        <View style={{ flex: 1, justifyContent: 'space-between', marginTop: 10 }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              borderBottomRightRadius: width / 2,
              borderBottomLeftRadius: width / 2,
              paddingHorizontal: 50,
              paddingTop: 50,
              marginBottom: 20,
            }}
          >
            <View style={styles.circle}/>
            <Animated.Image
              entering={FadeInUp.delay(200).duration(1000).springify()}
              source={require('../../assets/images/1.png')}
              style={{ width: width, height: width, objectFit: 'contain', resizeMode: 'contain',aspectRatio:1, borderRadius: width / 2 }}
            />
          </View>

          {/* Input fields */}
          <View style={{ margin: 22 }}>
            <View style={{ paddingHorizontal: 10, marginBottom: 20}}>
              <CustomText variant='h2' >login</CustomText>
              <CustomText variant="p">enterPhoneNumber</CustomText>
            </View>
            <View style={{ flex: 1, justifyContent:"space-evenly", marginBottom: 20}}>
              <KeyboardAvoidingView>
                <Animated.View entering={FadeInDown.duration(1000).springify()}>
                  <View style={styles.phoneInputContainer}>
                    <Text style={styles.flag}>🇪🇹</Text>
                    <Text style={styles.countryCode}>+251</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="9xxxxxxxx" // Updated placeholder
                      value={phoneNumber}
                      onChangeText={handlePhoneNumberChange}
                      keyboardType="phone-pad"
                      maxLength={9} // Limit input length to 9 digits
                    />
                  </View>
                  {errorSignal.phoneNumber && (
                    <Text style={styles.errorMessage}>Please enter a phone number</Text>
                  )}
                  {errorSignal.invalidFormat && ( // Show format error message
                    <Text style={styles.errorMessage}>Phone number must start with 9 and be 9 digits long.</Text>
                  )}
                </Animated.View>
              </KeyboardAvoidingView>

            </View>
            <ButtonComponent
                title={i18n.t('login')}
                handleButtonPress={handleLogin}
              />
              <View style={{flexDirection:"row", alignItems: "center", justifyContent:"center",gap:4}}>
              <CustomText
                variant="xs"
                translate={false}
                style={{color: Colors.light.gray}}>Don't have an account?
              </CustomText>
              <CustomLink title='signUp' handleLinkPress={()=>router.replace('/(authscreen)/signup')}/>
              </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;