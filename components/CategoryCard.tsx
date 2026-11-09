import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { memo } from "react";
import { Image } from "expo-image";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Colors={
    card:"#FFFFFF",
    textPrimary:"#173A2A",
    textSecondary:"#5F7568",
    separator:"#E2ECE4",
};

type CategoryCardProps={
    title:string;
    subtitle?:string;
    image:string;
    onPress:()=>void;
    compact?: boolean;
};

const {width: SCREEN_WIDTH}=Dimensions.get("window");

const CARD_WIDTH=(SCREEN_WIDTH-54)/2;

function CategoryCard({
    title,
    subtitle,
    image,
    onPress,
    compact = false,
}: CategoryCardProps){
    const handlePress=async()=>{
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };


    return(
        <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, compact && styles.compactCard]}
        onPress={handlePress}
        >
       <View style={[styles.imageContainer, compact && styles.compactImageContainer]}>
        {image ? (
            <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={120}
            />
        ) : (
            <Ionicons
            name="image-outline"
            size={30}
            color="#999"
            />
        )}
        </View>

        <View style={[styles.textSection, compact && styles.compactTextSection]}>
        <Text style={[styles.title, compact && styles.compactTitle]} numberOfLines={2}>
         {title}
        </Text>

        {!!subtitle && (
            <Text style={[styles.subtitle, compact && styles.compactSubtitle]} numberOfLines={2}>
            {subtitle}
        </Text>
        )}
        </View>

        {!compact && <View style={styles.arrowContainer}>
            <Ionicons
            name="arrow-forward"
            size={18}
            color={Colors.textSecondary}
            />
        </View>}
    </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  card: {
  width: CARD_WIDTH,
  height: 225,
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  padding: 16,
  borderWidth: 1,
  borderColor: "#E4EDE5",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: .06,
  shadowRadius: 8,
  elevation: 3,
  marginBottom: 18,
},
  compactCard: { width: (SCREEN_WIDTH - 48) / 3, height: 132, padding: 8, borderRadius: 14, marginBottom: 10, marginHorizontal: 3 },
  compactImageContainer: { height: 70, borderRadius: 9, marginBottom: 7 },
  compactTextSection: { flex: 0 },
  compactTitle: { fontSize: 11, lineHeight: 14, letterSpacing: -0.15 },
  compactSubtitle: { fontSize: 9, lineHeight: 12, marginTop: 2 },
  textSection: {
    flex:1,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing:-0.5,
    color: "#173A2A",
  },

  subtitle: {
    marginTop:6,
    fontSize: 12,
    color: "#75877B",
    lineHeight: 20,
  },
  content:{
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
  },

  arrowContainer:{
    alignItems:"flex-end",
  },

  leftSection:{
    flexDirection:"row",
    alignItems:"center",
    flex:1,
  },
  imageContainer: {
    width: "100%",
    height: 125,
    borderRadius: 13,
    backgroundColor: "#F3F8F4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    overflow:"hidden",
},

image: {
    width: "100%",
    height: "100%",
},
});

export default memo(CategoryCard);
