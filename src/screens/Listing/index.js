import { View, Text, Pressable, TextInput, ScrollView, Image, Alert, Platform, Dimensions } from 'react-native';
import { withAuthenticator } from 'aws-amplify-react-native'
import { Auth, Storage, API } from "aws-amplify";
import { AntDesign, MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { colors } from '../../modal/color';
import styles from "./styles";
import {  useNavigation, useRoute } from "@react-navigation/native"
import React, { useEffect, useState } from 'react';
import "react-native-get-random-values"
import {v4 as uuidv4} from "uuid";
import { createListing } from "../../graphql/mutations";
import HeaderForDesktop from "../../components/headerForDesktop";
import MenuDetailsForDesktop from "../../components/menuDetailsForDesktop";
import * as ImagePicker from "expo-image-picker";

const Listing = () => {
    const windowWidth = Number(Dimensions.get("window").width);
    const navigation = useNavigation();
    const [imageData, setImageData] = useState([]);
    const route = useRoute();
    const [category, setCategory] = useState({catID: 0, catName: "Category"});
    const [location, setLocation] = useState({locID: 0, locName: "Location"});
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [rentValue, setRentValue] = useState("");
    const [userID, setUserID] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [postProcessing, setPostProcessing] = useState(false);
    const [postSuccess, setPostSuccess] = useState("");

    //const [image, setImage] = useState(null);
    const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true,
    });

    // console.log(result);
    if (!result.cancelled) {
      setImageData(result.selected);
    }
  };

    useEffect(() => {
        if(postSuccess !== ""){
        setPostProcessing(false);
        Alert.alert(
            'Success',
            postSuccess,
            [
                { text: 'OK', onPress: () => navigation.navigate("Home", {screen: "Explore"}) }
            ]
        )
        }
    }, [postSuccess])

    Auth.currentAuthenticatedUser()
        .then((user) => {
            setUserID(user.attributes.sub);
            setUserEmail(user.attributes.email);
        })
        .catch((err) => {
            console.log(err);
            throw err;
        })

        useEffect(() => {
        if(!route.params){
            console.log("There is no data in route");
        } else {
            if(route.params.imageData !== undefined){
                setImageData(route.params.imageData);
            } else if(route.params.catID !== undefined){
                setCategory(route.params);
            } else if(route.params.locID !== undefined){
                setLocation(route.params);
            }
        }
    })
    const imageAllUrl = [];
    const storeToDB = async () => {
        setPostProcessing(true);
        imageData && imageData.map( async(component, index) => {
            const imageUrl = component.uri;
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            if (Platform.OS === "web") {
                const contentType = blob.type;
                const extension = contentType.split("/")[1];
                var key = `${uuidv4()}.${extension}`;
              } else {
                const urlParts = imageUrl.split(".");
                const extension = urlParts[urlParts.length - 1];
                var key = `${uuidv4()}.${extension}`;
              }
      
            imageAllUrl.push({imageUrl:key});
            await Storage.put(key, blob);
            
            if(imageData.length == index+1){
                const postData = {
                    title: title,
                    categoryName: category.catName,
                    categoryID: category.catID,
                    description: description,
                    images: JSON.stringify(imageAllUrl),
                    locationID: location.locID,
                    locationName: location.locName,
                    owner: userEmail,
                    rentValue: rentValue,
                    userID: userID,
                    commonID: "1"
                }

                await API.graphql({
                    query: createListing,
                    variables: { input: postData },
                    authMode: "AMAZON_COGNITO_USER_POOLS",
                  });
                  setImageData([]);
                  if (Platform.OS === "web") {
                    setPostProcessing(false);
                    alert("Your adv have successfully published.")
                    navigation.navigate("Home", { screen: "Explore" });
                  } else {
                    setPostProcessing(false);
                    setPostSuccess("Your adv have successfully published.");
                  }
            }
        })
    }
        // Auth.signOut();
    const [menuToggle, setMenuToggle] = useState(false);

  return (
        <View style={{ flex: 1, width: "100%", alignItems: "center" }}>
            <HeaderForDesktop setMenuToggle={setMenuToggle} menuToggle={menuToggle} />
            <ScrollView 
                style={{
                margin: 10,
                width: windowWidth > 800 ? "80%" : "100%",
                padding: windowWidth > 800 ? 50 : 10,
            }}>
                <View>
                    <Text style={{ marginTop: 10 }}>Upload images [Max 5 photos]</Text>
                    <Pressable style={styles.listing_imgupload} onPress={() => {
                            if (Platform.OS === "web") {
                                pickImage();
                            } else {
                                navigation.navigate("SelectPhotos");
                            }
                    }}>
                        <AntDesign name="pluscircle" size={24} color="black" />
                    </Pressable>
                </View>

                <View>
                    <ScrollView horizontal={true}>
                    {imageData && imageData.map((component, index) => (
                        <Image key={component.id} source={{uri: component.uri}} style={{
                            height:100, 
                            width: 100,
                            marginBottom: 20,
                            marginTop: -50,
                            marginRight: 5
                        }} />
                    ))}
                    </ScrollView>
                </View>

                <Pressable style={styles.listing_cat} onPress={() => {
                    navigation.navigate("SelectCategory");
                }}>
                <View style={{ flexDirection: 'row', alignItems: "center"}}>
                <MaterialIcons name="settings-input-composite" size={20} color={colors.secondary} />
                    <Text style={{ fontSize: 16, color: colors.secondary, marginLeft: 5}}>{category.catName}</Text>
                </View>
                    <AntDesign name="right" size={24} color={colors.secondary} />
                </Pressable>

                <Pressable style={styles.listing_cat} onPress={() => {
                    navigation.navigate("SelectLocation");
                }}>
                <View style={{ flexDirection: 'row', alignItems: "center"}}>
                <MaterialCommunityIcons name="map-marker" size={24} color={colors.secondary} />
                    <Text style={{ fontSize: 16, color: colors.secondary, marginLeft: 5}}>{location.locName}</Text>
                </View>
                    <AntDesign name="right" size={24} color={colors.secondary} />
                </Pressable>

                <View style={styles.inputText}>
                    <MaterialIcons name="title" size={24} color={colors.secondary} />
                    <TextInput placeholder="Adv Title" style={{
                        width: "100%", 
                        outline: Platform.OS === "web" && "none",
                    }} onChangeText={(text) => {
                        setTitle(text)
                    }} />
                </View>
                <View style={styles.inputText}>
                    <MaterialIcons name="description" size={24} color={colors.secondary} />
                    <TextInput placeholder="write a description" style={{ 
                        marginLeft: 5, 
                        width: "100%", 
                        outline: Platform.OS === "web" && "none",
                        }} onChangeText={(text) => {
                        setDescription(text)
                    }} multiline={true} numberOfLines={3} />
                </View>
                <View style={[styles.inputText, { width: "50%" }]}>
                    <FontAwesome name="rupee" size={24} color={colors.secondary} />
                    <TextInput placeholder="Add a value" style={{ marginLeft: 5, width: "100%", outline: Platform.OS === "web" && "none" }} onChangeText={(text) => setRentValue(text)} keyboardType="number-pad" />
                </View>

                <Pressable style={styles.post_adv} onPress={() => {
                    storeToDB()
                }} android_ripple={{color: "grey"}}>
                    <Text style={styles.post_adv_text}>{postProcessing ? "Processing..." : "POST ADV"}</Text>
                </Pressable>
            </ScrollView>
            <MenuDetailsForDesktop menuToggle={menuToggle} top={59} right={"9.3%"} />
        </View>
  );
}

export default withAuthenticator(Listing);
//export default Listing;