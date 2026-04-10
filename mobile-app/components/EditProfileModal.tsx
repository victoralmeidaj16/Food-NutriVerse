import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Image, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserProfile, UserGoal, ActivityLevel, RESTRICTION_OPTIONS, getRestrictionOptions } from '../types';
import { CloseIcon, CheckIcon, CameraIcon, UserIcon, PlusIcon, TrashIcon, SparklesIcon } from './Icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../context/LanguageContext';

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
  const [dislikes, setDislikes] = useState<string[]>(profile.dislikes || []);
  const [newDislike, setNewDislike] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | undefined>(profile.profilePicture);

  // Meu Gosto / Taste Profile fields
  const [favoriteDish, setFavoriteDish] = useState(profile.tasteProfile?.favoriteDish || '');
  const [favoriteFastFood, setFavoriteFastFood] = useState(profile.tasteProfile?.favoriteFastFood || '');
  const [favoriteSweet, setFavoriteSweet] = useState(profile.tasteProfile?.favoriteSweet || '');
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>(profile.tasteProfile?.favoriteFoods || []);
  const [newFavoriteFood, setNewFavoriteFood] = useState('');
  const [usualEatingHabits, setUsualEatingHabits] = useState(profile.tasteProfile?.usualEatingHabits || '');
  const [favoriteFoodImages, setFavoriteFoodImages] = useState<string[]>(profile.tasteProfile?.favoriteFoodImages || []);

  const { t, language } = useLanguage();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const toggleRestriction = (res: string) => {
    Haptics.selectionAsync();
    if (restrictions.includes(res)) {
      setRestrictions(prev => prev.filter(r => r !== res));
    } else {
      setRestrictions(prev => [...prev, res]);
    }
  };

  const addDislike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newDislike.trim()) {
      if (!dislikes.includes(newDislike.trim())) {
        setDislikes(prev => [...prev, newDislike.trim()]);
      }
      setNewDislike('');
    }
  };

  const removeDislike = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDislikes(prev => prev.filter(i => i !== item));
  };

  const addFavoriteFood = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (newFavoriteFood.trim() && !favoriteFoods.includes(newFavoriteFood.trim())) {
      setFavoriteFoods(prev => [...prev, newFavoriteFood.trim()]);
      setNewFavoriteFood('');
    }
  };

  const removeFavoriteFood = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavoriteFoods(prev => prev.filter(i => i !== item));
  };

  const pickFoodImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.5,
      selectionLimit: 6,
    });
    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setFavoriteFoodImages(prev => {
        const combined = [...prev, ...newUris];
        return combined.slice(0, 6); // max 6
      });
    }
  };

  const removeFoodImage = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavoriteFoodImages(prev => prev.filter(u => u !== uri));
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!name.trim()) {
      Alert.alert(t('common.error'), language === 'en' ? "Name cannot be empty." : "O nome não pode ficar vazio.");
      return;
    }

    const hasTasteData = favoriteDish.trim() || favoriteFastFood.trim() || favoriteSweet.trim() || favoriteFoods.length > 0 || usualEatingHabits.trim() || favoriteFoodImages.length > 0;

    onSave({
      ...profile,
      name,
      goal,
      activityLevel,
      dietaryRestrictions: restrictions,
      dislikes,
      profilePicture,
      tasteProfile: hasTasteData ? {
        favoriteDish: favoriteDish.trim(),
        favoriteFastFood: favoriteFastFood.trim(),
        favoriteSweet: favoriteSweet.trim(),
        favoriteFoods: favoriteFoods,
        usualEatingHabits: usualEatingHabits.trim(),
        favoriteFoodImages: favoriteFoodImages,
      } : profile.tasteProfile,
    });
    onClose();
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{language === 'en' ? 'Edit Profile' : 'Editar Perfil'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <CloseIcon size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
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
              <TouchableOpacity onPress={pickImage}>
                <Text style={styles.changePhotoText}>{language === 'en' ? 'Change Photo' : 'Alterar Foto'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{language === 'en' ? 'Name' : 'Nome'}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={language === 'en' ? 'Your name' : 'Seu nome'}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{language === 'en' ? 'Goal' : 'Objetivo'}</Text>
              <View style={styles.optionsRow}>
                {(language === 'en' ? [
                  { label: 'Lose Weight', val: UserGoal.LOSE_WEIGHT },
                  { label: 'Build Muscle', val: UserGoal.GAIN_MUSCLE },
                  { label: 'Maintain', val: UserGoal.MAINTAIN },
                  { label: 'Eat Healthy', val: UserGoal.EAT_HEALTHY }
                ] : [
                  { label: 'Perder Peso', val: UserGoal.LOSE_WEIGHT },
                  { label: 'Ganhar Massa', val: UserGoal.GAIN_MUSCLE },
                  { label: 'Manter', val: UserGoal.MAINTAIN },
                  { label: 'Saudável', val: UserGoal.EAT_HEALTHY }
                ]).map(opt => (
                  <TouchableOpacity
                    key={opt.val}
                    onPress={() => { Haptics.selectionAsync(); setGoal(opt.val); }}
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
              <Text style={styles.label}>{language === 'en' ? 'Activity Level' : 'Nível de Atividade'}</Text>
              <View style={styles.optionsRow}>
                {(language === 'en' ? [
                  { label: 'Low', val: ActivityLevel.LOW },
                  { label: 'Medium', val: ActivityLevel.MEDIUM },
                  { label: 'High', val: ActivityLevel.HIGH }
                ] : [
                  { label: 'Baixo', val: ActivityLevel.LOW },
                  { label: 'Médio', val: ActivityLevel.MEDIUM },
                  { label: 'Alto', val: ActivityLevel.HIGH }
                ]).map(opt => (
                  <TouchableOpacity
                    key={opt.val}
                    onPress={() => { Haptics.selectionAsync(); setActivityLevel(opt.val); }}
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
              <Text style={styles.label}>{language === 'en' ? 'Dietary Restrictions' : 'Restrições Alimentares'}</Text>
              <View style={styles.optionsRow}>
                {getRestrictionOptions(language).map((opt, index) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => toggleRestriction(RESTRICTION_OPTIONS[index])}
                    style={[styles.optionChip, restrictions.includes(RESTRICTION_OPTIONS[index]) && styles.optionChipSelected]}
                  >
                    <Text style={[styles.optionText, restrictions.includes(RESTRICTION_OPTIONS[index]) && styles.optionTextSelected]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{language === 'en' ? "What you DON'T like/eat?" : 'O que você NÃO gosta/come?'}</Text>
              <Text style={styles.helperText}>{language === 'en' ? 'These foods will be avoided in recipes.' : 'Esses alimentos serão evitados nas receitas.'}</Text>
              <View style={styles.addDislikeRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newDislike}
                  onChangeText={setNewDislike}
                  placeholder={language === 'en' ? 'E.g. Onion, Pepper...' : 'Ex: Cebola, Pimentão...'}
                  onSubmitEditing={addDislike}
                />
                <TouchableOpacity onPress={addDislike} style={styles.addBtn}>
                  <PlusIcon size={24} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.dislikesList}>
                {dislikes.map((item, index) => (
                  <View key={index} style={styles.dislikeChip}>
                    <Text style={styles.dislikeText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeDislike(item)}>
                      <TrashIcon size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* ——— MEU GOSTO ——— */}
            <View style={styles.section}>
              <View style={styles.tasteSectionHeader}>
                <SparklesIcon size={18} color="#a6f000" />
                <Text style={styles.label}>
                  {language === 'en' ? 'My Taste Profile' : 'Meu Gosto'}
                </Text>
              </View>
              <Text style={styles.helperText}>
                {language === 'en'
                  ? 'Help the AI suggest dishes that match your taste and habits.'
                  : 'Ajude a IA a sugerir pratos que combinam com seu gosto e hábitos.'}
              </Text>

              {/* Food reference photos */}
              <View style={styles.tasteField}>
                <Text style={styles.tasteLabel}>
                  {language === 'en' ? 'Food photos (reference)' : 'Fotos de alimentos (referência)'}
                </Text>
                <Text style={styles.helperText}>
                  {language === 'en' ? 'Upload photos of foods you love. Up to 6 images.' : 'Envie fotos de alimentos que você ama. Até 6 imagens.'}
                </Text>
                <View style={styles.foodImagesRow}>
                  {favoriteFoodImages.map((uri, i) => (
                    <View key={i} style={styles.foodImageThumb}>
                      <Image source={{ uri }} style={styles.foodImageImg} />
                      <TouchableOpacity style={styles.foodImageRemove} onPress={() => removeFoodImage(uri)}>
                        <CloseIcon size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {favoriteFoodImages.length < 6 && (
                    <TouchableOpacity style={styles.foodImageAdd} onPress={pickFoodImages}>
                      <PlusIcon size={24} color="#9CA3AF" />
                      <Text style={styles.foodImageAddText}>{language === 'en' ? 'Add' : 'Adicionar'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Favorite foods tag list */}
              <View style={styles.tasteField}>
                <Text style={styles.tasteLabel}>
                  {language === 'en' ? 'Foods you love' : 'Comidas que você ama'}
                </Text>
                <View style={styles.addDislikeRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newFavoriteFood}
                    onChangeText={setNewFavoriteFood}
                    placeholder={language === 'en' ? 'E.g. Chicken, Açaí, Sushi...' : 'Ex: Frango, Açaí, Sushi...'}
                    onSubmitEditing={addFavoriteFood}
                  />
                  <TouchableOpacity onPress={addFavoriteFood} style={styles.addBtnGreen}>
                    <PlusIcon size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <View style={styles.dislikesList}>
                  {favoriteFoods.map((item, index) => (
                    <View key={index} style={styles.favoriteFoodChip}>
                      <Text style={styles.favoriteFoodText}>{item}</Text>
                      <TouchableOpacity onPress={() => removeFavoriteFood(item)}>
                        <CloseIcon size={12} color="#15803d" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              {/* Usual eating habits */}
              <View style={styles.tasteField}>
                <Text style={styles.tasteLabel}>
                  {language === 'en' ? 'Typical eating habits' : 'Como você costuma comer'}
                </Text>
                <TextInput
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 }]}
                  value={usualEatingHabits}
                  onChangeText={setUsualEatingHabits}
                  placeholder={language === 'en'
                    ? 'E.g. I eat a lot of rice and beans, I love grilled food...'
                    : 'Ex: Como muito arroz e feijão, adoro grelhados...'}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Classic taste fields — compact row */}
              <View style={styles.tasteField}>
                <Text style={styles.tasteLabel}>
                  {language === 'en' ? 'Favorites' : 'Favoritos'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={favoriteDish}
                  onChangeText={setFavoriteDish}
                  placeholder={language === 'en' ? 'Favorite dish (e.g. Lasagna)' : 'Prato favorito (ex: Lasanha)'}
                />
                <TextInput
                  style={styles.input}
                  value={favoriteFastFood}
                  onChangeText={setFavoriteFastFood}
                  placeholder={language === 'en' ? 'Favorite fast food (e.g. Burger)' : 'Fast food favorito (ex: Hambúrguer)'}
                />
                <TextInput
                  style={styles.input}
                  value={favoriteSweet}
                  onChangeText={setFavoriteSweet}
                  placeholder={language === 'en' ? 'Favorite sweet (e.g. Chocolate)' : 'Doce favorito (ex: Chocolate)'}
                />
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{language === 'en' ? 'Save Changes' : 'Salvar Alterações'}</Text>
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
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 4,
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
  addDislikeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addBtn: {
    width: 56,
    height: 56,
    backgroundColor: 'black',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dislikesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dislikeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dislikeText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  tasteSectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  tasteField: {
    gap: 8,
  },
  tasteLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  addBtnGreen: {
    width: 56,
    height: 56,
    backgroundColor: '#a6f000',
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  favoriteFoodChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  favoriteFoodText: {
    color: '#15803d',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  // Food image upload
  foodImagesRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  foodImageThumb: {
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  foodImageImg: {
    width: '100%',
    height: '100%',
  },
  foodImageRemove: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  foodImageAdd: {
    width: 80,
    height: 80,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    backgroundColor: '#F9FAFB',
  },
  foodImageAddText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500' as const,
  },
});
