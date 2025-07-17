import ButtonComponent from '@/components/custom/CustomButton';
import CustomText from '@/components/custom/CustomText';
import { Colors } from '@/constants/Colors';
import i18n from '@/i18n'; // Make sure i18n is properly configured
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const ChooseLanguage = () => {
  // Initialize lang state with the current i18n locale if available,
  // otherwise default to empty or a default language like 'eng'
  const [lang, setLang] = useState(i18n.locale || '');
  const router = useRouter();

  const languages = [
    { label: 'አማርኛ', value: 'am' },
    { label: 'English', value: 'eng' },
    { label: 'Afaan Oromoo', value: 'oro' },
    { label: 'Soomaali', value: 'som' },
    { label: 'ትግርኛ', value: 'tig' },
  ];

  // Ensure i18n locale is updated if the initial state is set
  // (Might be redundant if i18n is initialized correctly elsewhere, but safe)
  useEffect(() => {
    if (lang && i18n.locale !== lang) {
      i18n.locale = lang;
    }
  }, [lang]); // Run only when lang changes

  const handleLanguageChange = (selectedLang: string) => {
    setLang(selectedLang);
    // **Change Locale Immediately**
    i18n.locale = selectedLang;
    // Optionally, save to AsyncStorage here immediately as well if needed persist across restarts before onboarding
    // AsyncStorage.setItem('language', selectedLang);
  };

  const handleLanguageSubmit = () => {
    // Locale is already set in handleLanguageChange
    // Persist the final choice if you haven't already
    AsyncStorage.setItem('language', lang); // Keep this if you want to save only on submit
    router.replace("/(onboarding)/onboarding");
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      {/* Image Section - unchanged */}
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: width * 0.7,
            height: width * 0.7,
            backgroundColor: Colors.dark.primary,
            borderRadius: width * 0.35,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            opacity: 0.2,
          }}
        />
        <Image
          source={require('@/assets/images/1.png')}
          style={{
            resizeMode: 'contain',
            aspectRatio: 1,
            width: width * 0.7,
            height: width * 0.7,
            borderRadius: width * 0.35,
            ...Dimensions.get('window').width > Dimensions.get('window').height && {
              transform: [{ scale: 0.4 }],
            },
          }}
        />
      </View>

      {/* Text Section - Use translate prop or i18n.t() */}
      <View style={{ flex: 0.1, justifyContent: 'flex-start' }}>
        {/* Make sure 'selectLanguage' is a key in your translation files */}
        <CustomText variant="h2" translate={true}>selectLanguage</CustomText>
        {/* This one was already using translate */}
      </View>

      {/* Language Selection Section - unchanged logic, but UI will update due to i18n change */}
      <View style={{ flex: 1, justifyContent: "space-around", }}>
        <View style={{ alignSelf: 'center', width: '100%' }}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.value}
              onPress={() => handleLanguageChange(language.value)}
              style={{
                height: 50,
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 10,
                borderRadius: 25,
                marginVertical: 5,
                borderWidth: 1,
                borderColor: Colors.dark.gray,
                alignItems: 'center',
                backgroundColor: lang === language.value ? Colors.dark.primary : 'transparent',
                opacity: lang === language.value ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  width: 24,
                  height: 24,
                  fontSize: 10,
                  borderRadius: 12,
                  textAlign: 'center',
                  lineHeight: 24,
                  color: lang === language.value ? Colors.light.text : Colors.dark.text,
                  backgroundColor: Colors.dark.primary,
                  fontWeight: "bold",
                }}
              >
                {language.value.slice(0, 2).toUpperCase()}
              </Text>

              <Text style={{ fontSize: 16, color: Colors.light.text }}>
                {language.label}
              </Text>

              {lang === language.value ? <Ionicons name="checkmark-circle" size={24} color={Colors.light.text} /> : <View />}
            </TouchableOpacity>
          ))}
        </View>
        {/* Button Section - title will now update immediately */}
        <ButtonComponent
          // title uses i18n.t() which will react to i18n.locale changes
          title={i18n.t('next')}
          handleButtonPress={handleLanguageSubmit}
          disabled={!lang} // Disable button if no language is selected
        />
      </View>

    </View>
  );
};

export default ChooseLanguage;