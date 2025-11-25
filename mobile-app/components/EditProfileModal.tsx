import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserProfile, UserGoal, ActivityLevel, RESTRICTION_OPTIONS } from '../types';
import { CloseIcon, CheckIcon, CameraIcon, UserIcon } from './Icons';

export const EditProfileModal = ({
  profile,
  onClose,
  onSave
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (p: UserProfile) => void;
}) => {
  const [name, setName] = useState(profile.name);
  const [goal, setGoal] = useState<UserGoal>(profile.goal);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [restrictions, setRestrictions] = useState<string[]>(profile.dietaryRestrictions);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(profile.profilePicture);

  const toggleRestriction = (res: string) => {
    if (restrictions.includes(res)) {
      setRestrictions(prev => prev.filter(r => r !== res));
    } else {
      setRestrictions(prev => [...prev, res]);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para alterar sua foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Erro", "O nome não pode ficar vazio.");
      return;
    }
    onSave({
      ...profile,
      name,
      goal,
      activityLevel,
      dietaryRestrictions: restrictions,
      profilePicture
    });
    onClose();
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar Perfil</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <CloseIcon size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>

          {/* Profile Picture Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.imageContainer}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <UserIcon size={40} color="#9CA3AF" />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <CameraIcon size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Alterar foto</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Objetivo</Text>
            <View style={styles.optionsRow}>
              {[
                { label: 'Perder Peso', val: UserGoal.LOSE_WEIGHT },
                { label: 'Ganhar Massa', val: UserGoal.GAIN_MUSCLE },
                { label: 'Manter', val: UserGoal.MAINTAIN },
                { label: 'Saudável', val: UserGoal.EAT_HEALTHY }
              ].map(opt => (
                <TouchableOpacity
                  key={opt.val}
                  onPress={() => setGoal(opt.val)}
                  style={[styles.optionChip, goal === opt.val && styles.optionChipSelected]}
                >
                  <Text style={[styles.optionText, goal === opt.val && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nível de Atividade</Text>
            <View style={styles.optionsRow}>
              {[
                { label: 'Baixo', val: ActivityLevel.LOW },
                { label: 'Médio', val: ActivityLevel.MEDIUM },
                { label: 'Alto', val: ActivityLevel.HIGH }
              ].map(opt => (
                <TouchableOpacity
                  key={opt.val}
                  onPress={() => setActivityLevel(opt.val)}
                  style={[styles.optionChip, activityLevel === opt.val && styles.optionChipSelected]}
                >
                  <Text style={[styles.optionText, activityLevel === opt.val && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Restrições Alimentares</Text>
            <View style={styles.optionsRow}>
              {RESTRICTION_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => toggleRestriction(opt)}
                  style={[styles.optionChip, restrictions.includes(opt) && styles.optionChipSelected]}
                >
                  <Text style={[styles.optionText, restrictions.includes(opt) && styles.optionTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Salvar Alterações</Text>
            <CheckIcon size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#a6f000',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changePhotoText: {
    color: '#a6f000',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionChipSelected: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  optionText: {
    fontWeight: '600',
    color: '#4B5563',
  },
  optionTextSelected: {
    color: 'white',
  },
  footer: {
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    backgroundColor: '#a6f000',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'black',
  },
});
