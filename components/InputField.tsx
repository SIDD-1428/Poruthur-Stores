// components/InputField.tsx
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

interface InputFieldProps extends TextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function InputField({ 
  placeholder, 
  value, 
  onChangeText, 
  secure = false,
  leftIcon,
  rightIcon,
  ...props 
}: InputFieldProps) {
  return (
    <View style={styles.container}>
      {leftIcon && (
        <View style={styles.leftIcon}>
          {leftIcon}
        </View>
      )}
      <TextInput
        style={[
          styles.input,
          leftIcon ? styles.inputWithLeftIcon : undefined,
          rightIcon ? styles.inputWithRightIcon : undefined,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        {...props}
      />
      {rightIcon && (
        <View style={styles.rightIcon}>
          {rightIcon}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
  },
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  leftIcon: {
    position: 'absolute',
    left: 14,
    top: 14,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 1,
  },
});