import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import i18n from '../../i18n';
import Pagination from '@/components/ui/onboarding/Pagination';
import SlideItem from '@/components/ui/onboarding/SlideItem';
import ButtonComponent from '@/components/custom/CustomButton';
import { router } from 'expo-router';

export type ItemBaseType = {
  key: number;
  image: any; // Use `ImageSourcePropType` if importing images via `require`
  amhImage: any;
  title: string;
  description: string;
};

const itemsBase: ItemBaseType[] = [
  {
    key: 1,
    image: require('@/assets/images/1.png'),
    amhImage: require('@/assets/images/1.png'),
    title: 'onboarding_1_title',
    description: 'onboarding_1_desc',
  },
  {
    key: 2,
    image: require('@/assets/images/2.png'),
    amhImage: require('@/assets/images/2.png'),
    title: 'onboarding_2_title',
    description: 'onboarding_2_desc',
  },
  {
    key: 3,
    image: require('@/assets/images/3.png'),
    amhImage: require('@/assets/images/3.png'),
    title: 'onboarding_3_title',
    description: 'onboarding_3_desc',
  },
  {
    key: 4,
    image: require('@/assets/images/1.png'),
    amhImage: require('@/assets/images/1.png'),
    title: 'onboarding_4_title',
    description: 'onboarding_4_desc',
  },
];

const OnboardingScreen = () => {
  const [index, setIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<ItemBaseType>>(null);
  const localLanguage = i18n.locale;

  const items = itemsBase.map((item) => ({
    ...item,
    image: localLanguage === 'Amharic' ? item.amhImage : item.image,
  }));

  const handleOnScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { useNativeDriver: false }
    )(event);
  };

  const handleNextPress = () => {
    if (index < items.length - 1) {
      flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      router.replace('/(authscreen)/login');
    }
  };

  const handleOnViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item.key.toString()}
        renderItem={({ item }) => <SlideItem item={item} />}
        horizontal
        pagingEnabled
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        onScroll={handleOnScroll}
        onViewableItemsChanged={handleOnViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <Pagination data={items} scrollX={scrollX} index={index} />
      <View style={styles.buttonContainer}>
        <ButtonComponent
          title={index === items.length - 1 ? i18n.t('getStarted') : i18n.t('next')}
          handleButtonPress={handleNextPress}
        />
      </View>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
});
