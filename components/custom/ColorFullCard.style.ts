import { Dimensions, StyleSheet } from "react-native";

const width = Dimensions.get("window").width;
const height = Dimensions.get("window").height;


const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    height: 100,
    width: width/3,
    padding: 12,
    marginVertical: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contentStyle: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  titleTextStyle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
    marginBottom: 4,
  },
  valueTextStyle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  valuePostfixTextStyle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#6B7280",
  },
  iconContainerStyle: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 30,
    padding: 10,
  },
  iconImageStyle: {
    width: 24,
    height: 24,
    tintColor: "#4B5563",
  },
  footerContainerStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  footerTextStyle: {
    fontSize: 16,
    color: "#6B7280",
  },
});

export default styles;
