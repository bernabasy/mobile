import React, { useState, useRef, useContext } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Text,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import ButtonComponent from '@/components/custom/CustomButton';
import { AuthContext } from '../../contexts/AuthContext';
import i18n from '@/i18n';
import { verifyOtpService } from '@/services/authServices';
import { showAlert } from '@/components/custom/Alert';

const { width } = Dimensions.get('screen');


const styles = StyleSheet.create({
  otpInput: {
    width: 50,
    height: 50,
    textAlign: 'center',
    borderWidth: 2,
    borderRadius: 10,
    borderColor: Colors.dark.primary,
    margin: 8,
    fontSize: 20,
    color: Colors.dark.primary,
    fontWeight: 'bold',
    backgroundColor: Colors.light.background,
  },
  errorMessage: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

const OtpScreen = () => {
  const router = useRouter();
  const { mobile } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const otpInputs = useRef([]);
  const [otpError, setOtpError] = useState(false);
   
  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtpService,
    onSuccess: async () => {
        showAlert(
          'Success',
          'OTP verified successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push({pathname:'/(authscreen)/pinInput',  params: {mobile: mobile} });
              },
            },
          ],
          {alertType: 'success'}
     
        )

    },
    onError: (err) => {
      setOtpError(true)
      showAlert(
        'Error',
        'OTP verification failed.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push({pathname:'/(authscreen)/otpScreen',  params: {mobile: mobile} });
            },
          },
        ],
        {alertType:'error'}
      )
    },
  });

  const handleChangeOtp = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setOtpError(false);

    if (text && index < otp.length - 1) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleVerifyOtp = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 5) {
      setOtpError(true);
      return;
    }
    verifyOtpMutation.mutate({ mobile: `+251${mobile}`, otp: fullOtp });

  };

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
            <Image
              source={require('../../assets/images/1.png')}
              style={{ width: width, height: width, objectFit: 'contain', resizeMode: 'contain',aspectRatio:1, borderRadius: width / 2 }}
            />
          </View>

          <View style={{ margin: 22 }}>
            <Text
              style={{
                fontSize: 32,
                textAlign: 'center',
                fontWeight: 'bold',
                color: Colors.dark.primary,
              }}
            >
              {i18n.t('otp')}
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins',
                textAlign: 'center',
                color: Colors.dark.icon,
              }}
            >
              {i18n.t('enterOtpOfFiveDigit')} {mobile}
            </Text>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1, justifyContent: 'center', marginTop: 20 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (otpInputs.current[index] = ref)}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleChangeOtp(text, index)}
                  />
                ))}
              </View>

              {otpError && (
                <Text style={styles.errorMessage}>Invalid OTP. Please try again.</Text>
              )}

              <ButtonComponent
                title={i18n.t('verify')}
                fontColor="white"
                handleButtonPress={handleVerifyOtp}
                loading={verifyOtpMutation.isPending}
              />
            </KeyboardAvoidingView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OtpScreen;
