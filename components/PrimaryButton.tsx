import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
};

export default function PrimaryButton({ title, onPress, disabled = false }: Props) {
    return (
        <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.7}
        >
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 40,
        width: "100%",
        backgroundColor: "black",
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    text: {
        color: "white",
        fontSize: 14,
        fontWeight: "500",
    },
});