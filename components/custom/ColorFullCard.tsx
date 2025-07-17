import * as React from "react";
import {
  View,
  Text,
  Image,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ImageSourcePropType,
  Pressable,
} from "react-native";
/**
 * ? Local Imports
 */
import styles from "./ColorFullCard.style";

type CustomStyleProp = StyleProp<ViewStyle> | Array<StyleProp<ViewStyle>>;
type CustomTextStyleProp = StyleProp<TextStyle> | Array<StyleProp<TextStyle>>;
type CustomImageStyleProp =
  | StyleProp<ImageStyle>
  | Array<StyleProp<ImageStyle>>;

export interface IColorfulCardProps {
  title: string;
  value: string;
  valuePostfix?: string;
  footerTitle: string;
  footerValue: string;
  style?: CustomStyleProp;
  contentStyle?: CustomStyleProp;
  iconContainerStyle?: CustomStyleProp;
  iconImageSource?: ImageSourcePropType;
  iconImageStyle?: CustomImageStyleProp;
  titleTextStyle?: CustomTextStyleProp;
  footerTextStyle?: CustomTextStyleProp;
  valueTextStyle?: CustomTextStyleProp;
  valuePostfixTextStyle?: CustomTextStyleProp;
  ImageComponent?: any;
  onPress: () => void;
}

const ColorfulCard: React.FC<IColorfulCardProps> = ({
  style,
  title,
  value,
  contentStyle,
  valuePostfix,
  iconImageSource,
  iconImageStyle,
  footerTitle,
  footerValue,
  titleTextStyle,
  footerTextStyle,
  valueTextStyle,
  iconContainerStyle,
  valuePostfixTextStyle,
  ImageComponent = Image,
  onPress,
}) => {
  const renderTitle = () => (
    <View>
      <Text lineBreakMode="tail" numberOfLines={1} style={[styles.titleTextStyle, titleTextStyle]}>{title}</Text>
    </View>
  );

  const renderIconContainer = () => (
    <View style={[styles.iconContainerStyle, iconContainerStyle]}>
      <ImageComponent
        source={iconImageSource}
        style={[styles.iconImageStyle, iconImageStyle]}
      />
    </View>
  );

  const renderContent = () => (
    <View style={[styles.contentStyle, contentStyle]}>
      <Text lineBreakMode="tail" numberOfLines={1} style={[styles.valueTextStyle, valueTextStyle]}>
        {`${value} `}
        <Text lineBreakMode="tail" numberOfLines={1} style={[styles.valuePostfixTextStyle, valuePostfixTextStyle]}>
          {valuePostfix}
        </Text>
      </Text>
    </View>
  );
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && { opacity: 0.8 }, // Optional feedback effect
      ]}
      onPress={onPress}
    >
      {renderContent()}
      {renderTitle()}
      {renderIconContainer()}
    </Pressable>
  );
};

export default ColorfulCard;
