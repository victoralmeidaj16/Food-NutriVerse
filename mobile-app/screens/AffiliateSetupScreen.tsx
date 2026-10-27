import React,{useState} from 'react';
import {ActivityIndicator,SafeAreaView,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import type {PurchaseReadinessResult} from '../services/purchaseReadiness';

export function AffiliateSetupScreen({result,onRetry,onContinueWithoutReferral}:{
    result:Extract<PurchaseReadinessResult,{status:'retryable_error'|'invalid_referral'}>;
    onRetry:()=>void|Promise<void>;
    onContinueWithoutReferral:()=>void|Promise<void>;
}) {
    const [loading,setLoading]=useState(false);
    const run=async(action:()=>void|Promise<void>)=>{setLoading(true);try{await action();}finally{setLoading(false);}};
    return <SafeAreaView style={styles.container}><View style={styles.card}>
        <Text style={styles.title}>Confirmar indicação</Text>
        <Text style={styles.message}>{result.message}</Text>
        <TouchableOpacity style={styles.primary} disabled={loading} onPress={()=>void run(onRetry)}>
            {loading?<ActivityIndicator color="#111827"/>:<Text style={styles.primaryText}>Tentar novamente</Text>}
        </TouchableOpacity>
        {result.status==='invalid_referral'&&<TouchableOpacity disabled={loading} onPress={()=>void run(onContinueWithoutReferral)}>
            <Text style={styles.secondaryText}>Continuar sem indicação</Text>
        </TouchableOpacity>}
    </View></SafeAreaView>;
}

const styles=StyleSheet.create({
    container:{flex:1,backgroundColor:'#FAFAFA',justifyContent:'center',padding:24},
    card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:24,gap:18},
    title:{fontSize:24,fontWeight:'800',color:'#111827'},
    message:{fontSize:16,lineHeight:23,color:'#4B5563'},
    primary:{minHeight:48,borderRadius:12,backgroundColor:'#a6f000',alignItems:'center',justifyContent:'center'},
    primaryText:{fontSize:16,fontWeight:'800',color:'#111827'},
    secondaryText:{fontSize:15,fontWeight:'700',color:'#4B5563',textAlign:'center',padding:8},
});
