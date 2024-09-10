import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {useSelector} from 'react-redux';
import {collection, doc, onSnapshot, query, updateDoc, where} from 'firebase/firestore';
import {firestoreDB} from '../Config/firebaseConfig';
import BookingCard from './BookingCard';
import {Ionicons} from "@expo/vector-icons"; // Assuming you created a separate component for the booking card

const NotificationScreen = ({ navigation }) => {
    const currentUser = useSelector((state) => state.user.user);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState('');

    useEffect(() => {
        // Assume role is stored in the user data
        setRole(currentUser?.role || 'student');  // Default to 'student' if role is undefined

        const fetchBookings = async () => {
            try {
                // Query based on user role (tutor or student)
                const bookingsQuery = query(
                    collection(firestoreDB, 'Bookings'),
                    where(role === 'Tutor' ? 'tutorId' : 'studentName', '==', role === 'Tutor' ? currentUser._id : currentUser.name)
                );

                return onSnapshot(bookingsQuery, (snapshot) => {
                    const fetchedBookings = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setBookings(fetchedBookings);
                    setLoading(false);
                }); // Clean up the listener on component unmount
            } catch (error) {
                console.error('Error fetching bookings:', error);
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchBookings();
        }
    }, [currentUser, role]);

    const handleAccept = async (bookingRef) => {

        try {
            // Update Firestore booking status to 'accepted'
            await updateDoc(doc(firestoreDB, 'Bookings', bookingRef), { status: 'accepted' });
            Alert.alert('Success', 'You have accepted the booking.');
        } catch (error) {
            console.error('Error accepting booking:', error);
            Alert.alert('Error', 'Failed to accept the booking.');
        }
    };

    const handleDecline = async (bookingRef) => {
        try {
            // Update Firestore booking status to 'declined'
            await updateDoc(doc(firestoreDB, 'Bookings', bookingRef), { status: 'declined' });
            Alert.alert('Success', 'You have declined the booking.');
        } catch (error) {
            console.error('Error declining booking:', error);
            Alert.alert('Error', 'Failed to decline the booking.');
        }
    };

    const handleChat = (booking) => {
        if (currentUser.role === 'Student'){
            navigation.navigate('ChatScreen', { booking.student });
        } else{
            navigation.navigate('ChatScreen', { booking.tutor});
        }
        
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00243a" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back-outline" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Notifications</Text>
                <Ionicons name="notifications-outline" size={28} color="transparent" />
            </View>
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                {bookings.map((booking) => (
                    <BookingCard
                        key={booking.id}
                        booking={booking}
                        role={role}
                        onAccept={() => handleAccept(booking.id)}
                        onDecline={() => handleDecline(booking.id)}
                        onChatPress={() => handleChat(booking)}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 10,
    },
    backButton: {
        padding: 5,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollViewContainer: {
        padding: 20,
    },
});

export default NotificationScreen;
