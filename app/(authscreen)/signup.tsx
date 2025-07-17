import ButtonComponent from '@/components/custom/CustomButton';
import CustomText from '@/components/custom/CustomText';
import CustomTextInput from '@/components/custom/CustomTextInput';
import { Colors } from '@/constants/Colors';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
// import Animated, { FadeInDown } from 'react-native-reanimated';
// import CustomLink from '@/components/custom/CustomLink';
// import { useMutation } from '@tanstack/react-query';
// import { signupService } from '@/services/authServices';

const { width } = Dimensions.get('screen');

const styles = StyleSheet.create({
  textInput: {
    marginBottom: 10,
    backgroundColor: 'rgba(3, 252, 182,0.2)',
    fontSize: 18,
    color: '#000',
    borderRadius: 16,
    paddingHorizontal: 10,
    height: 50,
  },
  circle: {
    width: width *0.8,
    height: width*0.8,
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
    marginBottom: 5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.icon,
    borderRadius: 26,
    paddingHorizontal: 10,
    height: 52,
    marginBottom: 10,
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
  inputContainer: {
    marginBottom: 15,
  },
  errorMessage: {
    color: 'red',
    fontSize: 16,
    marginBottom: 5,
  }
});

const Signup = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    mobile: '',
    pin: '',
  });

  const signupMutation = useMutation({
    mutationFn: signupService,
    onSuccess: (data) => {
      router.push({pathname: '/(authscreen)/otpScreen', params: {mobile: formData.mobile}});
    },
    onError: (error) => {
      console.log(error);
      setApiError(error?.message || 'Signup failed. Please try again.');
    },
  })

  const [errors, setErrors] = useState({
    firstname: false,
    lastname: false,
    mobile: false,
    mobileFormat: false,
    pin: false,
    pinFormat: false,
  });

  const handleSignup = () => {
    // Reset all errors
    const newErrors = {
      firstname: false,
      lastname: false,
      mobile: false,
      mobileFormat: false,
      pin: false,
      pinFormat: false,
    };
    
    // Validate fields
    if (!formData.firstname) newErrors.firstname = true;
    if (!formData.lastname) newErrors.lastname = true;
    if (!formData.mobile) {
      newErrors.mobile = true;
    } else {
      // Ethiopian phone number format validation (starts with 9, 9 digits long)
      const phoneRegex = /^9\d{8}$/;
      if (!phoneRegex.test(formData.mobile)) {
        newErrors.mobileFormat = true;
      }
    }
    if (!formData.pin) {
      newErrors.pin = true;
    } else if (formData.pin.length !== 6) {
      newErrors.pinFormat = true;
    }
    
    setErrors(newErrors);
    
    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) {
      return;
    }
    
    // Prepare data for API call
    const signupData = {
      firstname: formData.firstname,
      middlename: formData.middlename,
      lastname: formData.lastname,
      mobile: `+251${formData.mobile}`,
      pin: formData.pin,
    };
    
    // Make API call
    signupMutation.mutate(signupData as any);

  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false,
        [`${field}Format`]: false
      }));
    }
  };

  const handlePhoneNumberChange = (text) => {
    // Allow only digits and limit length
    const numericText = text.replace(/[^0-9]/g, '');
    handleInputChange('mobile', numericText);
  };

  const handlePinChange = (text) => {
    // Allow only digits and limit length
    const numericText = text.replace(/[^0-9]/g, '');
    handleInputChange('pin', numericText);
  };

  return (
    <SafeAreaView>
      <ScrollView>
        <View style={{ flex: 1, justifyContent: 'space-between', marginTop: 10 }}>

          {/* Input fields */}
          <View style={{ margin: 22 }}>
            <View style={{ paddingHorizontal: 10, marginBottom: 20}}>
              <CustomText variant='h2' translate={false}>Sign Up</CustomText>
              <CustomText variant="p" translate={false}>Create a new account</CustomText>
            </View>
            <View style={{ flex: 1, justifyContent:"space-evenly", marginBottom: 20}}>
              <KeyboardAvoidingView>
                <Animated.View entering={FadeInDown.duration(1000).springify()}>
                  {/* First Name */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput
                      label="First Name"
                      value={formData.firstname}
                      onChangeHandler={(text) => handleInputChange('firstname', text)}
                      required={true}
                      errorSignal={errors.firstname}
                    />
                    {errors.firstname && (
                      <Text style={styles.errorMessage}>Please enter your first name</Text>
                    )}
                  </View>

                  {/* Middle Name */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput
                      label="Middle Name (Optional)"
                      value={formData.middlename}
                      onChangeHandler={(text) => handleInputChange('middlename', text)}
                    />
                  </View>

                  {/* Last Name */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput
                      label="Last Name"
                      value={formData.lastname}
                      onChangeHandler={(text) => handleInputChange('lastname', text)}
                      required={true}
                      errorSignal={errors.lastname}
                    />
                    {errors.lastname && (
                      <Text style={styles.errorMessage}>Please enter your last name</Text>
                    )}
                  </View>

                  {/* Mobile Number - Keep custom implementation for country code */}
                  <View style={styles.inputContainer}>
                    <View style={styles.phoneInputContainer}>
                      <Text style={styles.flag}>🇪🇹</Text>
                      <Text style={styles.countryCode}>+251</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="9xxxxxxxx"
                        value={formData.mobile}
                        onChangeText={handlePhoneNumberChange}
                        keyboardType="phone-pad"
                        maxLength={9}
                      />
                    </View>
                    {errors.mobile && (
                      <Text style={styles.errorMessage}>Please enter a phone number</Text>
                    )}
                    {errors.mobileFormat && (
                      <Text style={styles.errorMessage}>Phone number must start with 9 and be 9 digits long</Text>
                    )}
                  </View>

                  {/* PIN */}
                  <View style={styles.inputContainer}>
                    <CustomTextInput
                      label="PIN (6 digits)"
                      value={formData.pin}
                      onChangeHandler={handlePinChange}
                      password={true}
                      keyboardType="numeric"
                      length={6}
                      errorSignal={errors.pin || errors.pinFormat}
                    />
                    {errors.pin && (
                      <Text style={styles.errorMessage}>Please enter your PIN</Text>
                    )}
                    {errors.pinFormat && (
                      <Text style={styles.errorMessage}>PIN must be 6 digits</Text>
                    )}
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </View>
            
            <ButtonComponent
              title="Sign Up"
              loading={signupMutation.isPending}
              handleButtonPress={handleSignup}
            />
            
            <View style={{flexDirection:"row", alignItems: "center", justifyContent:"center", gap:4, marginTop: 15}}>
              <CustomText
                variant="xs"
                translate={false}
                style={{color: Colors.light.gray}}>Already have an account?
              </CustomText>
              <CustomLink title="login" handleLinkPress={()=>router.replace('/(authscreen)/login')}/>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signup;