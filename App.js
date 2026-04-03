import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Animated, RefreshControl, Linking, Platform, StatusBar as RNBar, Dimensions, Modal } from "react-native";
import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import { LinearGradient as RawLG } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

var API = require("./utils/api");
var W = Dimensions.get("window").width;
var h = React.createElement;

function LinearGradient(p){
  var kids=p.children;
  var props={start:{x:0,y:0},end:{x:1,y:1},colors:p.colors,style:p.style};
  return h(RawLG,props,kids);
}

// Theme
var C = {bg:"#F5F0E6",card:"#FFFDF7",bdr:"#E8D5B7",gold:"#D4890B",goldL:"#E9A825",goldD:"#B8760A",green:"#2E7D32",greenL:"#43A047",greenD:"#1B5E20",red:"#D32F2F",txt:"#1A1A1A",txt2:"#5D4E37",sub:"#9B8A70",blue:"#1565C0",purple:"#7B1FA2"};
var TDS=["ஞா","தி","செ","பு","வி","வெ","ச"];var TMF=["ஜனவரி","பிப்ரவரி","மார்ச்","ஏப்ரல்","மே","ஜூன்","ஜூலை","ஆகஸ்ட்","செப்டம்பர்","அக்டோபர்","நவம்பர்","டிசம்பர்"];
var TDF=["ஞாயிறு","திங்கள்","செவ்வாய்","புதன்","வியாழன்","வெள்ளி","சனி"];
var SO=["","present","absent","overtime","halfday","leave"];
var SC={present:{l:"✅",n:"வந்தார்",c:"#2E7D32",bg:"#E8F5E9"},absent:{l:"❌",n:"வரவில்லை",c:"#D32F2F",bg:"#FFEBEE"},overtime:{l:"⏰",n:"OT",c:"#E65100",bg:"#FFF3E0"},halfday:{l:"½",n:"அரை",c:"#7B1FA2",bg:"#F3E5F5"},leave:{l:"🏖",n:"விடுப்பு",c:"#1565C0",bg:"#E3F2FD"}};

function F(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0});}
function FK(n){return Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:1})+" kg";}
function td(){return new Date().toISOString().slice(0,10);}
function fmtD(d){var x=new Date(d);return x.getDate()+" "+TMF[x.getMonth()]+" "+x.getFullYear();}
function getWeek(ref){var d=new Date(ref),day=d.getDay(),m=new Date(d);m.setDate(d.getDate()-((day+6)%7));var a=[];for(var i=0;i<7;i++){var dt=new Date(m);dt.setDate(m.getDate()+i);a.push(dt.toISOString().slice(0,10));}return a;}

// Bill helpers
function pBH(p){var ld=p.loads||[];var s="<html><head><meta name='viewport' content='width=device-width'><style>body{font-family:sans-serif;padding:20px;max-width:400px;margin:auto;font-size:14px}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ddd;padding:7px;text-align:center}th{background:#FFF8E1}.t{font-size:20px;font-weight:900;color:#2E7D32;text-align:right;margin-top:12px;padding-top:12px;border-top:3px solid #D4890B}h2{text-align:center}</style></head><body><h2>🟡 கொள்முதல் பில்</h2><p><b>விவசாயி:</b> "+p.farmer+" | 📱 "+(p.phone||"-")+"</p><p>🚛 "+(p.vehicle||"-")+" | 📅 "+fmtD(p.date)+"</p>"+(p.variety_ta?"<p>🟡 வகை: <b>"+p.variety_ta+"</b></p>":"");if(ld.length>0){s+="<table><tr><th>லோடு</th><th>வெற்று</th><th>ஏற்றிய</th><th>நிகர</th></tr>";ld.forEach(function(l,i){s+="<tr><td>"+(i+1)+"</td><td>"+l.emptyWt+"</td><td>"+l.loadedWt+"</td><td><b>"+l.netWt+"kg</b></td></tr>";});s+="</table>";}s+="<p>நிகர: <b>"+FK(p.total_net_weight)+"</b> | மண் கழிவு ("+p.deduction_per_ton+"/டன்): <b style='color:red'>-"+FK(p.deduction)+"</b></p><p>இறுதி: <b>"+FK(p.final_weight)+"</b> | விலை: "+F(p.price_per_kg)+"/kg</p><p class='t'>மொத்தம்: "+F(p.total_amount)+"</p></body></html>";return s;}
function pBT(p){var ld=p.loads||[];var s="🟡 *கொள்முதல் பில்*\n━━━━━━━━━━━━\n👤 *"+p.farmer+"*\n📱 "+(p.phone||"-")+"\n📅 "+fmtD(p.date)+(p.variety_ta?"\n🟡 வகை: "+p.variety_ta:"")+"\n\n";ld.forEach(function(l,i){s+="⚖️ #"+(i+1)+": "+l.emptyWt+"→"+l.loadedWt+" = "+l.netWt+"kg\n";});s+="\nநிகர: "+p.total_net_weight+"kg\nமண் கழிவு ("+p.deduction_per_ton+"/டன்): -"+(p.deduction||0).toFixed(1)+"kg\nஇறுதி: *"+p.final_weight.toFixed(1)+"kg*\n"+F(p.price_per_kg)+"/kg\n\n💵 *மொத்தம்: "+F(p.total_amount)+"*";return s;}
function sBH(s){var bags=s.bags||[];var r="<html><head><meta name='viewport' content='width=device-width'><style>body{font-family:sans-serif;padding:20px;max-width:400px;margin:auto;font-size:14px}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ddd;padding:7px;text-align:center}th{background:#FFF8E1}.t{font-size:20px;font-weight:900;color:#2E7D32;text-align:right;margin-top:12px;padding-top:12px;border-top:3px solid #D4890B}h2{text-align:center}</style></head><body><h2>🟡 விற்பனை பில்</h2><p><b>வாங்குபவர்:</b> "+s.farmer+" | 📱 "+(s.phone||"-")+"</p><p>📅 "+fmtD(s.date)+"</p>"+(s.variety_ta?"<p>🟡 வகை: <b>"+s.variety_ta+"</b></p>":"")+"<table><tr><th>மூட்டை</th><th>எடை</th></tr>";bags.forEach(function(b,i){r+="<tr><td>"+(i+1)+"</td><td><b>"+b+"kg</b></td></tr>";});r+="</table><p>மொத்தம்: <b>"+FK(s.total_weight)+"</b> | "+F(s.price_per_kg)+"/kg</p><p class='t'>மொத்தம்: "+F(s.total_amount)+"</p></body></html>";return r;}
function sBT(s){var bags=s.bags||[];var r="🟡 *விற்பனை பில்*\n━━━━━━━━━━━━\n👤 *"+s.farmer+"*\n📱 "+(s.phone||"-")+"\n📅 "+fmtD(s.date)+(s.variety_ta?"\n🟡 வகை: "+s.variety_ta:"")+"\n\n📦 மூட்டைகள்:\n";bags.forEach(function(b,i){r+="  "+(i+1)+". "+b+"kg\n";});r+="\n⚖️ "+s.total_weight+"kg | "+F(s.price_per_kg)+"/kg\n\n💵 *மொத்தம்: "+F(s.total_amount)+"*";return r;}
async function sharePDF(html){try{var r=await Print.printToFileAsync({html:html});if(await Sharing.isAvailableAsync())await Sharing.shareAsync(r.uri,{mimeType:"application/pdf"});}catch(e){Alert.alert("Error",e.message);}}
function sendWA(ph,txt){var n=(ph||"").replace(/\D/g,"");var u=n.length>=10?"https://wa.me/91"+n.slice(-10)+"?text="+encodeURIComponent(txt):"https://wa.me/?text="+encodeURIComponent(txt);Linking.openURL(u).catch(function(){});}

// ── UI Components ──
function ACard(p){var a=useRef(new Animated.Value(0)).current;useEffect(function(){Animated.spring(a,{toValue:1,tension:50,friction:8,delay:p.delay||0,useNativeDriver:true}).start();},[]);return h(Animated.View,{style:{opacity:a,transform:[{translateY:a.interpolate({inputRange:[0,1],outputRange:[20,0]})}]}},h(TouchableOpacity,{disabled:!p.onPress,onPress:p.onPress,activeOpacity:.85,style:[{backgroundColor:C.card,borderRadius:20,padding:16,borderWidth:1.5,borderColor:C.bdr,marginBottom:10,shadowColor:"#000",shadowOffset:{width:0,height:2},shadowOpacity:.05,shadowRadius:6,elevation:3},p.style]},p.children));}
function GS(p){var a=useRef(new Animated.Value(0)).current;useEffect(function(){Animated.spring(a,{toValue:1,tension:40,friction:7,delay:p.delay||0,useNativeDriver:true}).start();},[]);return h(Animated.View,{style:{flex:1,opacity:a,transform:[{scale:a}]}},h(LinearGradient,{colors:p.colors,style:{borderRadius:18,padding:16,height:90,justifyContent:"flex-end"}},h(Text,{style:{color:"rgba(255,255,255,.7)",fontSize:11,fontWeight:"700"}},p.label),h(Text,{style:{color:"#fff",fontSize:22,fontWeight:"900",marginTop:3}},p.value)));}
function GB(p){return h(TouchableOpacity,{onPress:p.onPress,activeOpacity:.8,disabled:p.disabled,style:[{borderRadius:16,overflow:"hidden",opacity:p.disabled?.5:1},p.style]},h(LinearGradient,{colors:p.colors||[C.gold,C.goldL],style:{paddingVertical:16,paddingHorizontal:24,alignItems:"center",flexDirection:"row",justifyContent:"center",gap:8}},h(Text,{style:{color:"#fff",fontSize:16,fontWeight:"800"}},p.title)));}
function Inp(p){return h(View,{style:{marginBottom:12}},p.label?h(Text,{style:{fontSize:13,fontWeight:"700",color:C.txt2,marginBottom:5}},p.label):null,h(TextInput,{value:p.value,onChangeText:p.onChangeText,placeholder:p.placeholder||"",keyboardType:p.keyboardType||"default",placeholderTextColor:"#C4B89A",style:{backgroundColor:"#FFFDF7",borderRadius:14,borderWidth:2,borderColor:C.bdr,padding:14,fontSize:16,fontWeight:"500",color:C.txt}}));}
function MP(p){var y=parseInt(p.value.split("-")[0]),m=parseInt(p.value.split("-")[1]);var sh=function(dir){var nm=m+dir,ny=y;if(nm>12){nm=1;ny++;}if(nm<1){nm=12;ny--;}p.onChange(ny+"-"+(nm<10?"0"+nm:nm));};return h(View,{style:{flexDirection:"row",alignItems:"center",backgroundColor:C.card,borderRadius:16,borderWidth:1.5,borderColor:C.bdr,padding:4,marginBottom:14}},h(TouchableOpacity,{onPress:function(){sh(-1);},style:{padding:12,backgroundColor:C.gold+"15",borderRadius:12}},h(Text,{style:{fontSize:18,color:C.gold}},"◀")),h(View,{style:{flex:1,alignItems:"center"}},h(Text,{style:{fontSize:18,fontWeight:"800",color:C.txt}},TMF[m-1]),h(Text,{style:{fontSize:12,color:C.sub}},String(y))),h(TouchableOpacity,{onPress:function(){sh(1);},style:{padding:12,backgroundColor:C.gold+"15",borderRadius:12}},h(Text,{style:{fontSize:18,color:C.gold}},"▶")));}

// ── Variety Picker ──
function VarPick(p){
  var _v=useState([]),vars=_v[0],setVars=_v[1];
  useEffect(function(){API.getVarieties().then(function(d){if(d&&!d.error)setVars(d);});},[p.refresh]);
  return h(View,{style:{marginBottom:12}},
    h(Text,{style:{fontSize:13,fontWeight:"700",color:C.txt2,marginBottom:5}},p.label||"🟡 மஞ்சள் வகை"),
    h(View,{style:{flexDirection:"row",flexWrap:"wrap",gap:6}},
      vars.map(function(v){var act=p.value===v.id;
        return h(TouchableOpacity,{key:v.id,onPress:function(){p.onChange(act?"":v.id);},style:{paddingVertical:10,paddingHorizontal:14,borderRadius:12,backgroundColor:act?C.gold+"20":C.card,borderWidth:2,borderColor:act?C.gold:C.bdr}},
          h(Text,{style:{fontSize:14,fontWeight:act?"800":"500",color:act?C.gold:C.txt}},v.name_ta||v.name));
      })));
}

// ═══ FARM HOME ═══
function FarmHome(p){
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{paddingBottom:100}},
    h(LinearGradient,{colors:[C.greenD,"#2E7D32","#388E3C"],style:{paddingTop:16,paddingBottom:24,paddingHorizontal:20,borderBottomLeftRadius:28,borderBottomRightRadius:28}},
      h(View,{style:{alignItems:"center"}},h(View,{style:{width:70,height:70,borderRadius:35,marginBottom:8,backgroundColor:"rgba(255,255,255,.2)",alignItems:"center",justifyContent:"center"}},h(Text,{style:{fontSize:36}},"🌾")),h(Text,{style:{fontSize:24,fontWeight:"900",color:"#fff"}},"விவசாய வேலை"),h(Text,{style:{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:3}},fmtD(td())+" • "+TDF[new Date().getDay()]))),
    h(View,{style:{padding:14,marginTop:10}},
      h(View,{style:{flexDirection:"row",gap:10,marginBottom:16}},h(GS,{label:"தொழிலாளர்",value:String(p.empCount||0),colors:[C.greenD,"#388E3C"],delay:100}),h(GS,{label:"இன்று",value:"0/"+(p.empCount||0),colors:["#00695C","#00897B"],delay:150})),
      [{i:"📋",l:"வருகை பதிவு",s:"தட்டி நிலை மாற்று",c:[C.greenD,"#43A047"],t:"attendance"},{i:"👥",l:"தொழிலாளர்கள்",s:"சேர் / நீக்கு",c:["#00695C","#00897B"],t:"employees"},{i:"💰",l:"சம்பளம்",s:"மாத கணக்கு",c:["#4E342E","#6D4C41"],t:"salary"},{i:"⚙️",l:"அமைப்பு",s:"ஊதியம் / கழிவு",c:["#37474F","#546E7A"],t:"settings"}].map(function(it,i){return h(ACard,{key:it.t,delay:200+i*60,onPress:function(){p.setTab(it.t);}},h(View,{style:{flexDirection:"row",alignItems:"center",gap:12}},h(LinearGradient,{colors:it.c,style:{width:50,height:50,borderRadius:14,alignItems:"center",justifyContent:"center"}},h(Text,{style:{fontSize:24}},it.i)),h(View,{style:{flex:1}},h(Text,{style:{fontSize:15,fontWeight:"700",color:C.txt}},it.l),h(Text,{style:{fontSize:11,color:C.sub,marginTop:2}},it.s)),h(Text,{style:{fontSize:18,color:C.bdr}},"›")));})));}

// ═══ TRADE HOME (DASHBOARD) ═══
function TradeHome(p){
  var _d=useState({}),dash=_d[0],setDash=_d[1];
  useEffect(function(){API.getDashboard().then(function(d){if(d&&!d.error)setDash(d);});},[p.refresh]);
  var raw=dash.remainingRaw||0;
  var boilEst=raw*0.95;var dryEst=boilEst*0.22;var finalEst=dryEst*0.93;var quintalEst=finalEst/100;
  var profit=dash.profit||0;
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{paddingBottom:100}},
    h(LinearGradient,{colors:[C.goldD,C.gold,C.goldL],style:{paddingTop:16,paddingBottom:24,paddingHorizontal:20,borderBottomLeftRadius:28,borderBottomRightRadius:28}},
      h(View,{style:{alignItems:"center"}},h(View,{style:{width:70,height:70,borderRadius:35,marginBottom:8,backgroundColor:"rgba(255,255,255,.2)",alignItems:"center",justifyContent:"center"}},h(Text,{style:{fontSize:36}},"🟡")),h(Text,{style:{fontSize:24,fontWeight:"900",color:"#fff"}},"மஞ்சள் வணிகம்"))),
    h(View,{style:{padding:14,marginTop:10}},
      h(View,{style:{flexDirection:"row",gap:10,marginBottom:10}},
        h(GS,{label:"🛒 கொள்முதல்",value:FK(dash.totalPurchased||0),colors:["#00695C","#00897B"],delay:100}),
        h(GS,{label:"🌱 விதை விற்பனை",value:FK(dash.totalSeedSold||0),colors:["#4E342E","#6D4C41"],delay:150})),
      h(View,{style:{flexDirection:"row",gap:10,marginBottom:10}},
        h(GS,{label:"📦 பச்சை இருப்பு",value:FK(raw),colors:[C.goldD,C.gold],delay:200}),
        h(GS,{label:"✨ இறுதி எடை (கணிப்பு)",value:FK(finalEst),colors:[C.purple,"#9C27B0"],delay:250})),
      h(View,{style:{flexDirection:"row",gap:10,marginBottom:14}},
        h(GS,{label:"⚖️ குவிண்டால் (கணிப்பு)",value:quintalEst.toFixed(1)+" Q",colors:["#37474F","#546E7A"],delay:300}),
        h(GS,{label:profit>=0?"📈 லாபம்":"📉 நட்டம்",value:F(Math.abs(profit)),colors:profit>=0?[C.greenD,"#43A047"]:["#C62828","#E53935"],delay:350})),
      [{i:"🛒",l:"கொள்முதல்",s:"விவசாயிகளிடம் வாங்கு",c:[C.goldD,C.gold],t:"purchase"},
       {i:"🌱",l:"விதை விற்பனை",s:"விவசாயிகளுக்கு விற்பனை",c:["#2E7D32","#43A047"],t:"sales"},
       {i:"🏪",l:"சந்தை",s:"விலை → வருமானம் (Live)",c:["#BF360C","#E64A19"],t:"market"},
       {i:"📦",l:"இருப்பு",s:"வகை வாரியாக",c:["#4E342E","#6D4C41"],t:"stock"}
      ].map(function(it,i){return h(ACard,{key:it.t,delay:400+i*50,onPress:function(){p.setTab(it.t);}},h(View,{style:{flexDirection:"row",alignItems:"center",gap:12}},h(LinearGradient,{colors:it.c,style:{width:50,height:50,borderRadius:14,alignItems:"center",justifyContent:"center"}},h(Text,{style:{fontSize:24}},it.i)),h(View,{style:{flex:1}},h(Text,{style:{fontSize:15,fontWeight:"700",color:C.txt}},it.l),h(Text,{style:{fontSize:11,color:C.sub,marginTop:2}},it.s)),h(Text,{style:{fontSize:18,color:C.bdr}},"›")));})));}

// ═══ EMPLOYEES ═══
function EmployeesPage(){
  var _e=useState([]),emps=_e[0],setEmps=_e[1];var _l=useState(true),ld=_l[0],setLd=_l[1];var _s=useState(false),show=_s[0],setShow=_s[1];
  var _n=useState(""),nm=_n[0],setNm=_n[1];var _g=useState("female"),gn=_g[0],setGn=_g[1];var _w=useState(""),wage=_w[0],setWage=_w[1];
  var load=function(){setLd(true);API.getEmployees().then(function(d){if(d&&!d.error)setEmps(d);setLd(false);});};
  useEffect(function(){load();},[]);
  var add=function(){if(!nm.trim())return;API.addEmployee(nm.trim(),gn,"",Number(wage)||0,"worker").then(function(){setNm("");setWage("");setShow(false);load();});};
  var del=function(id,n){Alert.alert("நீக்கு",'"'+n+'"',[{text:"ரத்து"},{text:"நீக்கு",style:"destructive",onPress:function(){API.deleteEmployee(id).then(load);}}]);};
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:14,paddingBottom:100},refreshControl:h(RefreshControl,{refreshing:ld,onRefresh:load})},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:14}},"👥 தொழிலாளர்கள் ("+emps.length+")"),
    show?h(ACard,{delay:0,style:{borderColor:C.gold,borderWidth:2.5}},
      h(Inp,{label:"பெயர்",value:nm,onChangeText:setNm,placeholder:"பெயர்"}),
      h(Inp,{label:"தினசரி ஊதியம் ₹ (காலியாக விட்டால் அமைப்பு பயன்படும்)",value:wage,onChangeText:setWage,keyboardType:"numeric",placeholder:"0"}),
      h(View,{style:{flexDirection:"row",gap:10,marginBottom:14}},
        [["female","👩 பெண்",C.red],["male","👨 ஆண்",C.green]].map(function(a){return h(TouchableOpacity,{key:a[0],onPress:function(){setGn(a[0]);},style:{flex:1,paddingVertical:14,borderRadius:14,borderWidth:3,borderColor:gn===a[0]?a[2]:C.bdr,backgroundColor:gn===a[0]?a[2]+"12":"#FFFDF7",alignItems:"center"}},h(Text,{style:{fontSize:15,fontWeight:"800",color:gn===a[0]?a[2]:C.sub}},a[1]));})),
      h(View,{style:{flexDirection:"row",gap:10}},h(GB,{title:"✅ சேர்",onPress:add,colors:[C.green,C.greenL],style:{flex:1},disabled:!nm.trim()}),h(GB,{title:"ரத்து",onPress:function(){setShow(false);setNm("");setWage("");},colors:[C.sub,"#B0A090"],style:{flex:.5}}))
    ):h(GB,{title:"➕ புதிய தொழிலாளர்",onPress:function(){setShow(true);},style:{marginBottom:14}}),
    emps.map(function(e,i){return h(ACard,{key:e.id,delay:i*50},h(View,{style:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}},h(View,{style:{flexDirection:"row",alignItems:"center",gap:12}},h(LinearGradient,{colors:e.gender==="female"?["#E91E63","#F06292"]:["#2E7D32","#66BB6A"],style:{width:46,height:46,borderRadius:14,alignItems:"center",justifyContent:"center"}},h(Text,{style:{fontSize:22}},e.gender==="female"?"👩":"👨")),h(View,null,h(Text,{style:{fontSize:16,fontWeight:"700",color:C.txt}},e.name),h(Text,{style:{fontSize:11,color:C.sub}},e.daily_wage>0?F(e.daily_wage)+"/நாள்":(e.gender==="female"?"பெண்":"ஆண்")))),h(TouchableOpacity,{onPress:function(){del(e.id,e.name);},style:{backgroundColor:"#FFEBEE",padding:10,borderRadius:12}},h(Text,{style:{fontSize:16}},"🗑️"))));}));}

// ═══ ATTENDANCE ═══
function AttendancePage(){
  var _e=useState([]),emps=_e[0],setEmps=_e[1];var _a=useState({}),att=_a[0],setAtt=_a[1];var _w=useState(td()),wr=_w[0],setWr=_w[1];var _l=useState(true),ld=_l[0],setLd=_l[1];
  var wd=useMemo(function(){return getWeek(wr);},[wr]);var ws=new Date(wd[0]),we=new Date(wd[6]);
  var load=function(){setLd(true);Promise.all([API.getEmployees(),API.getAttendance(wd[0],wd[6])]).then(function(r){if(r[0]&&!r[0].error)setEmps(r[0]);if(r[1]&&!r[1].error){var m={};r[1].forEach(function(x){if(!m[x.date])m[x.date]={};m[x.date][x.emp_id]=x.status;});setAtt(m);}setLd(false);});};
  useEffect(function(){load();},[wr]);
  var gs=function(eid,dt){return(att[dt]||{})[eid]||"";};
  var cycle=function(eid,dt){var cur=gs(eid,dt),idx=SO.indexOf(cur),nx=SO[(idx+1)%SO.length];setAtt(function(prev){var n=Object.assign({},prev);if(!n[dt])n[dt]={};n[dt]=Object.assign({},n[dt]);n[dt][eid]=nx;return n;});API.setAttendance(eid,dt,nx);};
  var shift=function(dir){var d=new Date(wr);d.setDate(d.getDate()+dir*7);setWr(d.toISOString().slice(0,10));};
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:12,paddingBottom:100},refreshControl:h(RefreshControl,{refreshing:ld,onRefresh:load})},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:12}},"📋 வருகை பதிவு"),
    h(View,{style:{backgroundColor:C.card,borderRadius:18,padding:12,borderWidth:1.5,borderColor:C.bdr,marginBottom:14}},
      h(View,{style:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:10}},
        h(TouchableOpacity,{onPress:function(){shift(-1);},style:{padding:10,backgroundColor:C.gold+"15",borderRadius:12}},h(Text,{style:{fontSize:18}},"◀")),
        h(View,{style:{alignItems:"center"}},h(Text,{style:{fontSize:16,fontWeight:"800",color:C.txt}},TMF[ws.getMonth()]+" "+ws.getDate()+" - "+we.getDate()),h(Text,{style:{fontSize:11,color:C.sub}},String(ws.getFullYear()))),
        h(TouchableOpacity,{onPress:function(){shift(1);},style:{padding:10,backgroundColor:C.gold+"15",borderRadius:12}},h(Text,{style:{fontSize:18}},"▶"))),
      h(View,{style:{flexDirection:"row",gap:8,justifyContent:"center"}},
        h(TouchableOpacity,{onPress:function(){setWr(td());},style:{paddingVertical:8,paddingHorizontal:14,backgroundColor:"#E8F5E9",borderRadius:10}},h(Text,{style:{fontSize:13,fontWeight:"700",color:C.green}},"📅 இன்று")),
        h(TouchableOpacity,{onPress:function(){API.bulkAttendance(td(),emps.map(function(e){return e.id;}),"present").then(load);},style:{paddingVertical:8,paddingHorizontal:14,backgroundColor:"#E8F5E9",borderRadius:10}},h(Text,{style:{fontSize:13,fontWeight:"700",color:C.green}},"✅ எல்லோரும்")))),
    h(View,{style:{flexDirection:"row",marginBottom:4}},h(View,{style:{width:70}}),wd.map(function(dt){var d=new Date(dt),di=d.getDay(),isT=dt===td(),sun=di===0;return h(View,{key:dt,style:{flex:1,alignItems:"center",paddingVertical:5,marginHorizontal:1,borderRadius:10,backgroundColor:isT?C.gold:sun?"#FFEBEE":"transparent"}},h(Text,{style:{fontSize:10,fontWeight:"800",color:isT?"#fff":sun?C.red:C.sub}},TDS[di]),h(Text,{style:{fontSize:14,fontWeight:"900",color:isT?"#fff":sun?C.red:C.txt}},String(d.getDate())));})),
    emps.map(function(emp,ei){return h(ACard,{key:emp.id,delay:ei*30,style:{padding:8,marginBottom:6}},h(View,{style:{flexDirection:"row",alignItems:"center"}},h(View,{style:{width:70,paddingRight:4}},h(Text,{numberOfLines:1,style:{fontSize:12,fontWeight:"700",color:C.txt}},(emp.gender==="female"?"👩":"👨")+" "+emp.name)),wd.map(function(dt){var st=gs(emp.id,dt),cfg=st?SC[st]:null;return h(TouchableOpacity,{key:dt,onPress:function(){cycle(emp.id,dt);},activeOpacity:.7,style:{flex:1,aspectRatio:1,borderRadius:10,marginHorizontal:1,backgroundColor:cfg?cfg.bg:"#EFEBE0",alignItems:"center",justifyContent:"center",minHeight:38}},h(Text,{style:{fontSize:cfg?16:11,color:cfg?cfg.c:"#C4B89A",fontWeight:"800"}},cfg?cfg.l:"·"));})));}),
    h(View,{style:{flexDirection:"row",flexWrap:"wrap",gap:5,marginTop:8}},Object.entries(SC).map(function(kv){return h(View,{key:kv[0],style:{flexDirection:"row",alignItems:"center",paddingVertical:4,paddingHorizontal:8,backgroundColor:kv[1].bg,borderRadius:8}},h(Text,{style:{fontSize:12}},kv[1].l+" "),h(Text,{style:{fontSize:10,fontWeight:"700",color:kv[1].c}},kv[1].n));})));}

// ═══ SALARY ═══
function SalaryPage(){
  var _m=useState(td().slice(0,7)),month=_m[0],setMonth=_m[1];var _r=useState([]),rows=_r[0],setRows=_r[1];var _l=useState(true),ld=_l[0],setLd=_l[1];
  var _sel=useState(null),sel=_sel[0],setSel=_sel[1];var _advAmt=useState(""),advAmt=_advAmt[0],setAdvAmt=_advAmt[1];var _payAmt=useState(""),payAmt=_payAmt[0],setPayAmt=_payAmt[1];var _mode=useState(null),mode=_mode[0],setMode=_mode[1];
  var load=function(){setLd(true);API.getSalaryReport(month).then(function(d){if(d&&!d.error)setRows(d);setLd(false);});};
  useEffect(function(){load();},[month]);
  var total=rows.reduce(function(s,r){return s+r.earned;},0);var totalBal=rows.reduce(function(s,r){return s+Math.max(0,r.balance);},0);
  var sr=sel?rows.find(function(r){return r.id===sel;}):null;
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:14,paddingBottom:100},refreshControl:h(RefreshControl,{refreshing:ld,onRefresh:load})},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:12}},"💰 சம்பளம்"),
    h(MP,{value:month,onChange:setMonth}),
    h(View,{style:{flexDirection:"row",gap:10,marginBottom:16}},h(GS,{label:"மொத்தம்",value:F(total),colors:[C.greenD,C.green],delay:40}),h(GS,{label:"மீதி",value:F(totalBal),colors:["#C62828","#E53935"],delay:80})),
    rows.filter(function(r){return r.active!==false;}).map(function(r,i){return h(ACard,{key:r.id,delay:100+i*40,onPress:function(){setSel(r.id);setMode(null);setAdvAmt("");setPayAmt("");}},
      h(View,{style:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}},
        h(View,{style:{flexDirection:"row",alignItems:"center",gap:10}},h(LinearGradient,{colors:r.gender==="female"?["#E91E63","#F06292"]:["#2E7D32","#66BB6A"],style:{width:42,height:42,borderRadius:12,alignItems:"center",justifyContent:"center"}},h(Text,{style:{fontSize:18}},"💰")),h(View,null,h(Text,{style:{fontSize:14,fontWeight:"700",color:C.txt}},r.name),h(Text,{style:{fontSize:11,color:C.sub}},r.totalDays+" நாள் • "+r.ot+" OT"))),
        r.isPaid?h(LinearGradient,{colors:["#2E7D32","#43A047"],style:{paddingHorizontal:12,paddingVertical:6,borderRadius:12}},h(Text,{style:{color:"#fff",fontSize:11,fontWeight:"800"}},"✅ பெற்றது")):h(View,{style:{alignItems:"flex-end"}},h(Text,{style:{fontSize:17,fontWeight:"900",color:C.green}},F(r.earned)),r.balance>0&&r.balance!==r.earned?h(Text,{style:{fontSize:10,color:C.red,fontWeight:"700"}},"மீதி "+F(r.balance)):null)));}),
    // Modal
    sel&&sr?h(Modal,{visible:true,transparent:true,animationType:"slide",onRequestClose:function(){setSel(null);}},
      h(TouchableOpacity,{activeOpacity:1,onPress:function(){setSel(null);},style:{flex:1,backgroundColor:"rgba(0,0,0,.4)",justifyContent:"flex-end"}},
        h(View,{style:{backgroundColor:C.bg,borderTopLeftRadius:24,borderTopRightRadius:24,maxHeight:"85%"}},
          h(ScrollView,{contentContainerStyle:{padding:20},nestedScrollEnabled:true},
            h(View,{style:{width:40,height:4,borderRadius:2,backgroundColor:"#D9D0C0",alignSelf:"center",marginBottom:14}}),
            h(View,{style:{alignItems:"center",marginBottom:16}},h(Text,{style:{fontSize:20,fontWeight:"900",color:C.txt}},(sr.gender==="female"?"👩":"👨")+" "+sr.name),h(Text,{style:{fontSize:13,color:C.sub,marginTop:2}},TMF[parseInt(month.split("-")[1])-1]+" "+month.split("-")[0])),
            h(View,{style:{backgroundColor:C.card,borderRadius:16,padding:14,marginBottom:14,borderWidth:1.5,borderColor:C.bdr}},
              [["📅 வேலை நாட்கள்",String(sr.days)],["⏰ OT",String(sr.ot)],["½ அரை",String(sr.hd)],["📊 மொத்தம்",String(sr.totalDays)]].map(function(a){return h(View,{key:a[0],style:{flexDirection:"row",justifyContent:"space-between",paddingVertical:6,borderBottomWidth:1,borderBottomColor:"#F0E6D2"}},h(Text,{style:{fontSize:13,color:C.txt2}},a[0]),h(Text,{style:{fontSize:14,fontWeight:"700"}},a[1]));}),
              h(View,{style:{marginTop:8}},[["💰 சம்பளம்",F(sr.earned),C.green],["💸 முன்பணம்(-)",F(sr.totalAdv),"#E65100"],["✅ கொடுத்தது(-)",F(sr.totalPaid),C.blue]].map(function(a){return h(View,{key:a[0],style:{flexDirection:"row",justifyContent:"space-between",paddingVertical:6}},h(Text,{style:{fontSize:13,fontWeight:"600",color:C.txt2}},a[0]),h(Text,{style:{fontSize:15,fontWeight:"800",color:a[2]}},a[1]));})),
              h(View,{style:{flexDirection:"row",justifyContent:"space-between",paddingTop:10,marginTop:6,borderTopWidth:2,borderTopColor:C.bdr}},h(Text,{style:{fontSize:16,fontWeight:"800"}},"மீதி:"),h(Text,{style:{fontSize:20,fontWeight:"900",color:sr.isPaid?C.green:C.red}},sr.isPaid?"✅ பெற்றது":F(Math.max(0,sr.balance))))),
            sr.advances&&sr.advances.length>0?h(View,{style:{marginBottom:10}},h(Text,{style:{fontSize:13,fontWeight:"700",color:"#E65100",marginBottom:6}},"💸 முன்பணம்:"),sr.advances.map(function(a){return h(View,{key:a.id,style:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:"#FFF8E1",borderRadius:10,padding:10,marginBottom:4}},h(View,null,h(Text,{style:{fontSize:13,fontWeight:"700",color:"#E65100"}},F(a.amount)),h(Text,{style:{fontSize:10,color:C.sub}},a.date)),h(TouchableOpacity,{onPress:function(){Alert.alert("நீக்கு",F(a.amount)+" நீக்க?",[{text:"ரத்து"},{text:"நீக்கு",style:"destructive",onPress:function(){API.deleteAdvance(a.id).then(load);}}]);},style:{backgroundColor:"#FFEBEE",padding:6,borderRadius:8}},h(Text,{style:{fontSize:12}},"🗑️")));})):null,
            sr.payments&&sr.payments.length>0?h(View,{style:{marginBottom:10}},h(Text,{style:{fontSize:13,fontWeight:"700",color:C.blue,marginBottom:6}},"💰 கொடுத்தது:"),sr.payments.map(function(p){return h(View,{key:p.id,style:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:"#E3F2FD",borderRadius:10,padding:10,marginBottom:4}},h(View,null,h(Text,{style:{fontSize:13,fontWeight:"700",color:C.blue}},F(p.amount)),h(Text,{style:{fontSize:10,color:C.sub}},p.date)),h(TouchableOpacity,{onPress:function(){Alert.alert("நீக்கு",F(p.amount)+" நீக்க?",[{text:"ரத்து"},{text:"நீக்கு",style:"destructive",onPress:function(){API.deletePayment(p.id).then(load);}}]);},style:{backgroundColor:"#FFEBEE",padding:6,borderRadius:8}},h(Text,{style:{fontSize:12}},"🗑️")));})):null,
            mode==="adv"?h(View,{style:{backgroundColor:"#FFF8E1",borderRadius:14,padding:14,marginBottom:10}},h(Inp,{label:"💸 முன்பணம் தொகை",value:advAmt,onChangeText:setAdvAmt,keyboardType:"numeric"}),h(View,{style:{flexDirection:"row",gap:8}},h(GB,{title:"சேமி",onPress:function(){if(Number(advAmt)>0){API.addAdvance(sel,td(),Number(advAmt),"").then(function(){setAdvAmt("");setMode(null);load();});}},colors:["#E65100","#FF8F00"],style:{flex:1},disabled:!advAmt||Number(advAmt)<=0}),h(GB,{title:"ரத்து",onPress:function(){setMode(null);},colors:[C.sub,"#B0A090"],style:{flex:.5}}))):null,
            mode==="pay"?h(View,{style:{backgroundColor:"#E8F5E9",borderRadius:14,padding:14,marginBottom:10}},h(Inp,{label:"💰 கொடுக்கும் தொகை",value:payAmt,onChangeText:setPayAmt,keyboardType:"numeric"}),h(View,{style:{flexDirection:"row",gap:8}},h(GB,{title:"சேமி",onPress:function(){if(Number(payAmt)>0){API.addPayment(sel,td(),Number(payAmt),month).then(function(){setPayAmt("");setMode(null);load();});}},colors:[C.green,C.greenL],style:{flex:1},disabled:!payAmt||Number(payAmt)<=0}),h(GB,{title:"ரத்து",onPress:function(){setMode(null);},colors:[C.sub,"#B0A090"],style:{flex:.5}}))):null,
            !mode?h(View,{style:{gap:8}},
              h(GB,{title:"💸 முன்பணம் கொடு",onPress:function(){setMode("adv");},colors:["#E65100","#FF8F00"]}),
              !sr.isPaid&&sr.balance>0?h(GB,{title:"✅ "+F(sr.balance)+" முழுவதும் கொடு",onPress:function(){API.addPayment(sel,td(),sr.balance,month).then(load);},colors:[C.green,C.greenL]}):null,
              h(GB,{title:"💰 வேறு தொகை கொடு",onPress:function(){setMode("pay");},colors:[C.blue,"#1E88E5"]}),
              h(GB,{title:"மூடு",onPress:function(){setSel(null);},colors:[C.sub,"#B0A090"]})
            ):null
          )))
    ):null
  );}

// ═══ SETTINGS ═══
function SettingsPage(){var _s=useState({}),settings=_s[0],setSettings=_s[1];
  useEffect(function(){API.getSettings().then(function(d){if(d&&!d.error)setSettings(d);});},[]);
  var sv=function(k,v){var n=Object.assign({},settings);n[k]=v;setSettings(n);var o={};o[k]=v;API.updateSettings(o);};
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:14,paddingBottom:100}},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:14}},"⚙️ அமைப்புகள்"),
    h(ACard,{delay:0,style:{marginBottom:10}},h(Text,{style:{fontSize:16,fontWeight:"800",color:C.red,marginBottom:10}},"👩 பெண்"),h(Inp,{label:"தினசரி ₹",value:String(settings.femaleDay||"350"),onChangeText:function(v){sv("femaleDay",v);},keyboardType:"numeric"}),h(Inp,{label:"OT ₹",value:String(settings.femaleOT||"100"),onChangeText:function(v){sv("femaleOT",v);},keyboardType:"numeric"})),
    h(ACard,{delay:60,style:{marginBottom:10}},h(Text,{style:{fontSize:16,fontWeight:"800",color:C.green,marginBottom:10}},"👨 ஆண்"),h(Inp,{label:"தினசரி ₹",value:String(settings.maleDay||"800"),onChangeText:function(v){sv("maleDay",v);},keyboardType:"numeric"}),h(Inp,{label:"OT ₹",value:String(settings.maleOT||"50"),onChangeText:function(v){sv("maleOT",v);},keyboardType:"numeric"})),
    h(ACard,{delay:120},h(Text,{style:{fontSize:16,fontWeight:"800",color:C.gold,marginBottom:10}},"📝 குறிப்பு"),h(Text,{style:{fontSize:13,color:C.sub}},"மண் கழிவு ஒவ்வொரு கொள்முதலிலும் தனித்தனியாக உள்ளிடப்படும் — ஒவ்வொரு லோடும் வேறுபடும்.")));}

// ═══ PURCHASE — MULTI LOAD ═══
function PurchasePage(){
  var _d=useState([]),ps=_d[0],setPs=_d[1];var _l=useState(true),ld=_l[0],setLd=_l[1];var _s=useState(false),show=_s[0],setShow=_s[1];
  var _f=useState(""),farmer=_f[0],setFarmer=_f[1];var _ph=useState(""),phone=_ph[0],setPhone=_ph[1];var _v=useState(""),vehicle=_v[0],setVehicle=_v[1];
  var _loads=useState([{emptyWt:"",loadedWt:"",varId:""}]),loads=_loads[0],setLoads=_loads[1];
  var _dp=useState(""),dedPT=_dp[0],setDedPT=_dp[1];var _pp=useState(""),ppkg=_pp[0],setPpkg=_pp[1];
  var load=function(){setLd(true);API.getPurchases().then(function(d){if(d&&!d.error)setPs(d);setLd(false);});};
  useEffect(function(){load();},[]);
  var loadsCalc=loads.map(function(l){var e=Number(l.emptyWt)||0;var lo=Number(l.loadedWt)||0;return{e:e,lo:lo,net:Math.max(0,lo-e),varId:l.varId||""};});
  var totalNet=loadsCalc.reduce(function(s,l){return s+l.net;},0);
  var ded=(totalNet/1000)*(Number(dedPT)||0);var finalWt=Math.max(0,totalNet-ded);var totalAmt=finalWt*(Number(ppkg)||0);
  var addLoad=function(){setLoads(loads.concat({emptyWt:"",loadedWt:"",varId:""}));};
  var removeLoad=function(idx){if(loads.length<=1)return;setLoads(loads.filter(function(_,i){return i!==idx;}));};
  var updateLoad=function(idx,key,val){setLoads(loads.map(function(l,i){if(i!==idx)return l;var n=Object.assign({},l);n[key]=val;return n;}));};
  var doSave=function(){if(!farmer.trim()||finalWt<=0||!dedPT)return;API.addPurchase({date:td(),farmer:farmer.trim(),phone:phone.trim(),vehicle:vehicle.trim(),variety_id:loads[0].varId||"",loads:loadsCalc.map(function(l){return{emptyWt:l.e,loadedWt:l.lo,netWt:l.net,varId:l.varId};}),total_net_weight:totalNet,deduction_per_ton:Number(dedPT),deduction:ded,final_weight:finalWt,price_per_kg:Number(ppkg),total_amount:totalAmt}).then(function(){setFarmer("");setPhone("");setVehicle("");setLoads([{emptyWt:"",loadedWt:"",varId:""}]);setDedPT("");setPpkg("");setShow(false);load();});};
  var reset=function(){setShow(false);setFarmer("");setPhone("");setVehicle("");setLoads([{emptyWt:"",loadedWt:"",varId:""}]);setDedPT("");setPpkg("");};
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:14,paddingBottom:100},refreshControl:h(RefreshControl,{refreshing:ld,onRefresh:load})},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:12}},"🛒 கொள்முதல்"),
    show?h(ACard,{delay:0,style:{borderColor:C.gold,borderWidth:2.5}},
      h(Inp,{label:"🧑‍🌾 விவசாயி",value:farmer,onChangeText:setFarmer,placeholder:"பெயர்"}),
      h(Inp,{label:"📱 மொபைல்",value:phone,onChangeText:setPhone,placeholder:"9876543210",keyboardType:"phone-pad"}),
      h(Inp,{label:"🚛 வாகனம்",value:vehicle,onChangeText:setVehicle,placeholder:"TN 00 XX 0000"}),
      // Multiple loads — each with own variety
      h(Text,{style:{fontSize:14,fontWeight:"800",color:C.gold,marginBottom:8}},"🚛 லோடுகள் ("+loads.length+")"),
      loads.map(function(l,idx){
        return h(View,{key:idx,style:{backgroundColor:"#F5F0E6",borderRadius:14,padding:10,marginBottom:8}},
          h(View,{style:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:6}},
            h(LinearGradient,{colors:[C.gold,C.goldL],style:{paddingHorizontal:12,paddingVertical:4,borderRadius:8}},h(Text,{style:{color:"#fff",fontWeight:"800",fontSize:13}},"லோடு #"+(idx+1))),
            loads.length>1?h(TouchableOpacity,{onPress:function(){removeLoad(idx);},style:{backgroundColor:"#FFEBEE",padding:6,borderRadius:8}},h(Text,{style:{fontSize:12}},"🗑️")):null),
          h(VarPick,{value:l.varId||"",onChange:function(v){updateLoad(idx,"varId",v);},label:"🟡 வகை"}),
          h(View,{style:{flexDirection:"row",gap:8}},
            h(View,{style:{flex:1}},h(Inp,{label:"வெற்று (kg)",value:l.emptyWt,onChangeText:function(v){updateLoad(idx,"emptyWt",v);},keyboardType:"numeric",placeholder:"5000"})),
            h(View,{style:{flex:1}},h(Inp,{label:"ஏற்றிய (kg)",value:l.loadedWt,onChangeText:function(v){updateLoad(idx,"loadedWt",v);},keyboardType:"numeric",placeholder:"15000"}))),
          loadsCalc[idx]&&loadsCalc[idx].net>0?h(Text,{style:{textAlign:"right",fontSize:13,fontWeight:"700",color:C.green}},"நிகர: "+FK(loadsCalc[idx].net)):null);
      }),
      h(TouchableOpacity,{onPress:addLoad,style:{alignSelf:"flex-start",paddingVertical:10,paddingHorizontal:16,backgroundColor:C.gold+"15",borderRadius:12,marginBottom:10}},h(Text,{style:{fontSize:14,fontWeight:"700",color:C.gold}},"➕ லோடு சேர்")),
      h(View,{style:{flexDirection:"row",gap:8}},
        h(View,{style:{flex:1}},h(Inp,{label:"📉 மண் கழிவு/டன்",value:dedPT,onChangeText:setDedPT,keyboardType:"numeric",placeholder:"40/50/60"})),
        h(View,{style:{flex:1}},h(Inp,{label:"💰 விலை ₹/kg",value:ppkg,onChangeText:setPpkg,keyboardType:"numeric",placeholder:"20"}))),
      totalNet>0?h(LinearGradient,{colors:["#FFF8E1","#FFF3C4"],style:{borderRadius:16,padding:14,marginBottom:14,borderWidth:2,borderColor:"#FFD54F"}},
        [{l:"நிகர ("+loads.length+" லோடு):",v:FK(totalNet)},{l:"மண் கழிவு ("+dedPT+"/டன்):",v:"-"+FK(ded),c:C.red},{l:"இறுதி எடை:",v:FK(finalWt),c:C.green}].map(function(r){return h(View,{key:r.l,style:{flexDirection:"row",justifyContent:"space-between",marginBottom:4}},h(Text,{style:{fontSize:13}},r.l),h(Text,{style:{fontWeight:"700",color:r.c||C.txt}},r.v));}),
        h(View,{style:{flexDirection:"row",justifyContent:"space-between",paddingTop:8,borderTopWidth:2,borderTopColor:"#FFD54F",marginTop:4}},h(Text,{style:{fontSize:17,fontWeight:"800"}},"மொத்தம்:"),h(Text,{style:{fontSize:20,fontWeight:"900",color:C.green}},F(totalAmt)))
      ):null,
      h(View,{style:{flexDirection:"row",gap:8}},h(GB,{title:"✅ சேமி",onPress:doSave,colors:[C.green,C.greenL],style:{flex:1},disabled:!farmer.trim()||finalWt<=0||!dedPT}),h(GB,{title:"ரத்து",onPress:reset,colors:[C.sub,"#B0A090"],style:{flex:.5}}))
    ):h(GB,{title:"➕ புதிய கொள்முதல்",onPress:function(){setShow(true);},style:{marginBottom:14}}),
    ps.map(function(p,i){var lc=(p.loads||[]).length;return h(ACard,{key:p.id,delay:i*30,onPress:function(){Alert.alert("🧾 "+p.farmer,fmtD(p.date)+(p.variety_ta?" • "+p.variety_ta:"")+"\n"+lc+" லோடு • "+FK(p.final_weight)+"\nமண் கழிவு: "+p.deduction_per_ton+"/டன்\nவிலை: "+F(p.price_per_kg)+"/kg\nமொத்தம்: "+F(p.total_amount),[{text:"மூடு"},{text:"🗑️",style:"destructive",onPress:function(){API.deletePurchase(p.id).then(load);}},{text:"🖨️ PDF",onPress:function(){sharePDF(pBH(p));}},{text:"📲 WA",onPress:function(){sendWA(p.phone,pBT(p));}}]);}},h(View,{style:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}},h(View,{style:{flex:1}},h(Text,{style:{fontSize:14,fontWeight:"700",color:C.txt}},"🧑‍🌾 "+p.farmer+(p.variety_ta?" • "+p.variety_ta:"")),h(Text,{style:{fontSize:11,color:C.sub,marginTop:2}},fmtD(p.date)+" • "+lc+"லோடு • "+FK(p.final_weight))),h(View,{style:{alignItems:"flex-end"}},h(Text,{style:{fontSize:16,fontWeight:"900",color:C.gold}},F(p.total_amount)),h(Text,{style:{fontSize:9,color:C.gold}},"🧾 →"))));}));}

// ═══ SALES (BAG BY BAG) ═══
function SalesPage(){
  var _d=useState([]),sales=_d[0],setSales=_d[1];var _l=useState(true),ld=_l[0],setLd=_l[1];var _s=useState(false),show=_s[0],setShow=_s[1];
  var _f=useState(""),farmer=_f[0],setFarmer=_f[1];var _ph=useState(""),phone=_ph[0],setPhone=_ph[1];
  var _var=useState(""),varId=_var[0],setVarId=_var[1];
  var _b=useState([]),bags=_b[0],setBags=_b[1];var _bv=useState(""),bagVal=_bv[0],setBagVal=_bv[1];var _pp=useState(""),ppkg=_pp[0],setPpkg=_pp[1];
  var load=function(){setLd(true);API.getSales().then(function(d){if(d&&!d.error)setSales(d);setLd(false);});};
  useEffect(function(){load();},[]);
  var tw=bags.reduce(function(s,w){return s+w;},0);var ta=tw*(Number(ppkg)||0);
  var addBag=function(){var v=Number(bagVal);if(v>0){setBags(bags.concat(v));setBagVal("");}};
  var removeBag=function(idx){setBags(bags.filter(function(_,i){return i!==idx;}));};
  var doSave=function(){if(!farmer.trim()||tw<=0)return;
    API.addSale({date:td(),farmer:farmer.trim(),phone:phone.trim(),variety_id:varId,bags:bags,total_weight:tw,price_per_kg:Number(ppkg),total_amount:ta}).then(function(r){
      if(r&&r.error){Alert.alert("❌ பிழை",r.error);return;}
      setFarmer("");setPhone("");setVarId("");setBags([]);setBagVal("");setPpkg("");setShow(false);load();});};
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:14,paddingBottom:100},refreshControl:h(RefreshControl,{refreshing:ld,onRefresh:load})},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:12}},"💵 விற்பனை"),
    show?h(ACard,{delay:0,style:{borderColor:C.gold,borderWidth:2.5}},
      h(Inp,{label:"🧑‍🌾 வாங்குபவர்",value:farmer,onChangeText:setFarmer,placeholder:"பெயர்"}),
      h(Inp,{label:"📱 மொபைல்",value:phone,onChangeText:setPhone,placeholder:"9876543210",keyboardType:"phone-pad"}),
      h(VarPick,{value:varId,onChange:setVarId}),
      h(Text,{style:{fontSize:14,fontWeight:"700",color:C.txt2,marginBottom:8}},"📦 மூட்டை எடைகள்"),
      bags.length>0?h(View,{style:{maxHeight:200,marginBottom:10}},h(ScrollView,{nestedScrollEnabled:true},
        bags.map(function(bg,idx){return h(View,{key:idx,style:{flexDirection:"row",alignItems:"center",backgroundColor:"#F5F0E6",borderRadius:12,padding:10,marginBottom:6}},h(LinearGradient,{colors:[C.gold,C.goldL],style:{width:36,height:36,borderRadius:10,alignItems:"center",justifyContent:"center",marginRight:10}},h(Text,{style:{color:"#fff",fontSize:13,fontWeight:"800"}},"#"+(idx+1))),h(Text,{style:{flex:1,fontSize:18,fontWeight:"700",color:C.txt}},bg+" kg"),h(TouchableOpacity,{onPress:function(){removeBag(idx);},style:{backgroundColor:"#FFEBEE",padding:8,borderRadius:10}},h(Text,{style:{fontSize:14}},"🗑️")));}),
        h(View,{style:{flexDirection:"row",justifyContent:"space-between",paddingTop:8,borderTopWidth:1.5,borderTopColor:C.bdr,marginTop:4}},h(Text,{style:{fontWeight:"700",color:C.txt2,fontSize:15}},bags.length+" மூட்டை:"),h(Text,{style:{fontWeight:"900",fontSize:18,color:C.green}},FK(tw))))):null,
      h(View,{style:{flexDirection:"row",gap:6,marginBottom:6,alignItems:"flex-end"}},h(View,{style:{flex:1}},h(Inp,{placeholder:"எடை (kg)",value:bagVal,onChangeText:setBagVal,keyboardType:"numeric"})),h(TouchableOpacity,{onPress:addBag,style:{backgroundColor:C.green,paddingVertical:14,paddingHorizontal:14,borderRadius:14,marginBottom:12}},h(Text,{style:{color:"#fff",fontWeight:"800",fontSize:13}},"➕ சேர்"))),
      h(Inp,{label:"💰 கிலோ ₹",value:ppkg,onChangeText:setPpkg,keyboardType:"numeric",placeholder:"25"}),
      tw>0&&Number(ppkg)>0?h(LinearGradient,{colors:["#FFF8E1","#FFF3C4"],style:{borderRadius:16,padding:14,marginBottom:14,borderWidth:2,borderColor:"#FFD54F"}},h(View,{style:{flexDirection:"row",justifyContent:"space-between",marginBottom:4}},h(Text,null,bags.length+" மூட்டை:"),h(Text,{style:{fontWeight:"700"}},FK(tw))),h(View,{style:{flexDirection:"row",justifyContent:"space-between",paddingTop:8,borderTopWidth:2,borderTopColor:"#FFD54F",marginTop:4}},h(Text,{style:{fontSize:17,fontWeight:"800"}},"மொத்தம்:"),h(Text,{style:{fontSize:20,fontWeight:"900",color:C.green}},F(ta)))):null,
      h(View,{style:{flexDirection:"row",gap:8}},h(GB,{title:"✅ சேமி",onPress:doSave,colors:[C.green,C.greenL],style:{flex:1},disabled:!farmer.trim()||tw<=0}),h(GB,{title:"ரத்து",onPress:function(){setShow(false);setBags([]);},colors:[C.sub,"#B0A090"],style:{flex:.5}}))
    ):h(GB,{title:"➕ புதிய விற்பனை",onPress:function(){setShow(true);},style:{marginBottom:14}}),
    sales.map(function(s,i){return h(ACard,{key:s.id,delay:i*30,onPress:function(){Alert.alert("🧾 "+s.farmer,fmtD(s.date)+(s.variety_ta?" • "+s.variety_ta:"")+"\n"+(s.bags||[]).length+" மூட்டை = "+FK(s.total_weight)+"\nமொத்தம்: "+F(s.total_amount),[{text:"மூடு"},{text:"🗑️",style:"destructive",onPress:function(){API.deleteSale(s.id).then(load);}},{text:"🖨️ PDF",onPress:function(){sharePDF(sBH(s));}},{text:"📲 WA",onPress:function(){sendWA(s.phone,sBT(s));}}]);}},h(View,{style:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}},h(View,{style:{flex:1}},h(Text,{style:{fontSize:14,fontWeight:"700",color:C.txt}},s.farmer+(s.variety_ta?" • "+s.variety_ta:"")),h(Text,{style:{fontSize:11,color:C.sub,marginTop:2}},fmtD(s.date)+" • "+(s.bags||[]).length+"மூட்டை")),h(View,{style:{alignItems:"flex-end"}},h(Text,{style:{fontSize:16,fontWeight:"900",color:C.gold}},F(s.total_amount)),h(Text,{style:{fontSize:9,color:C.gold}},"🧾 →"))));}));}

// ═══ MARKET — ALL-IN-ONE ═══
function MarketPage(){
  var _dash=useState({}),dash=_dash[0],setDash=_dash[1];var _l=useState(true),ld=_l[0],setLd=_l[1];
  var _rate=useState(""),rate=_rate[0],setRate=_rate[1];
  var load=function(){setLd(true);API.getDashboard().then(function(d){if(d&&!d.error)setDash(d);setLd(false);});};
  useEffect(function(){load();},[]);
  var raw=dash.remainingRaw||0;
  var boil=raw*0.95;var dry=boil*0.22;var polish=dry*0.93;
  var quintal=polish/100;var yp=raw>0?(polish/raw)*100:0;
  var yColor=yp<18?C.red:yp<=25?C.green:C.blue;
  var revenue=quintal*(Number(rate)||0);

  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:14,paddingBottom:100},refreshControl:h(RefreshControl,{refreshing:ld,onRefresh:load})},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:4}},"🏪 சந்தை (ஈரோடு)"),
    h(Text,{style:{fontSize:12,color:C.sub,marginBottom:14}},"பச்சை இருப்பு அடிப்படையில் Live கணக்கீடு"),
    // Pipeline summary
    h(ACard,{delay:20},
      h(Text,{style:{fontSize:15,fontWeight:"800",color:C.gold,marginBottom:10}},"📊 தற்போதைய நிலை:"),
      [["🛒 கொள்முதல்",FK(dash.totalPurchased||0),C.gold],
       ["🌱 விதை விற்பனை","-"+FK(dash.totalSeedSold||0),"#4E342E"],
       ["📦 பச்சை இருப்பு",FK(raw),raw>0?C.green:C.red]
      ].map(function(a){return h(View,{key:a[0],style:{flexDirection:"row",justifyContent:"space-between",paddingVertical:8,borderBottomWidth:1,borderBottomColor:"#F0E6D2"}},h(Text,{style:{fontSize:14,fontWeight:"600",color:C.txt2}},a[0]),h(Text,{style:{fontSize:17,fontWeight:"800",color:a[2]}},a[1]));})),
    // Processing estimates
    raw>0?h(ACard,{delay:60},
      h(Text,{style:{fontSize:15,fontWeight:"800",color:C.purple,marginBottom:12}},"🧪 பதப்படுத்தல் கணிப்பு:"),
      [{icon:"🫕",label:"கொதிக்க பின் (×0.95)",value:FK(boil),sub:"ஈரம் நீக்கம்"},
       {icon:"☀️",label:"உலர்த்திய பின் (×0.22)",value:FK(dry),sub:"எடை குறையும்"},
       {icon:"✨",label:"பாலிஷ் பின் (×0.93)",value:FK(polish),sub:"மேல் தோல் நீக்கம்"}
      ].map(function(step,i){return h(View,{key:i,style:{flexDirection:"row",alignItems:"center",paddingVertical:10,borderBottomWidth:1,borderBottomColor:"#E1BEE7"}},
        h(Text,{style:{fontSize:22,marginRight:12}},step.icon),
        h(View,{style:{flex:1}},h(Text,{style:{fontSize:13,fontWeight:"700",color:C.txt}},step.label),h(Text,{style:{fontSize:10,color:C.sub}},step.sub)),
        h(Text,{style:{fontSize:16,fontWeight:"800",color:C.purple}},step.value));}),
      h(View,{style:{marginTop:12,backgroundColor:"#F3E5F5",borderRadius:14,padding:14}},
        h(View,{style:{flexDirection:"row",justifyContent:"space-between",marginBottom:6}},h(Text,{style:{fontWeight:"700"}},"✅ இறுதி எடை:"),h(Text,{style:{fontSize:18,fontWeight:"900",color:C.green}},FK(polish))),
        h(View,{style:{flexDirection:"row",justifyContent:"space-between",marginBottom:6}},h(Text,{style:{fontWeight:"700"}},"⚖️ குவிண்டால்:"),h(Text,{style:{fontSize:18,fontWeight:"900",color:C.gold}},quintal.toFixed(2)+" Q")),
        h(View,{style:{flexDirection:"row",justifyContent:"space-between"}},h(Text,{style:{fontWeight:"700"}},"📊 விளைச்சல்:"),h(Text,{style:{fontSize:18,fontWeight:"900",color:yColor}},yp.toFixed(1)+"%")),
        h(View,{style:{alignItems:"center",marginTop:8,padding:6,backgroundColor:yColor+"15",borderRadius:10}},
          h(Text,{style:{fontSize:13,fontWeight:"800",color:yColor}},(yp<18?"🔴 குறை":yp<=25?"🟢 சாதாரணம்":"🔵 அதிக")+" விளைச்சல்")))
    ):null,
    // Market rate — LIVE revenue (no sell button)
    h(ACard,{delay:100,style:{borderColor:"#BF360C",borderWidth:2}},
      h(Text,{style:{fontSize:16,fontWeight:"800",color:"#BF360C",marginBottom:10}},"💰 சந்தை விலை (Live)"),
      h(Inp,{label:"₹ / குவிண்டால்",value:rate,onChangeText:setRate,keyboardType:"numeric",placeholder:"12000"}),
      Number(rate)>0&&quintal>0?h(LinearGradient,{colors:["#E8F5E9","#C8E6C9"],style:{borderRadius:16,padding:16,borderWidth:2,borderColor:"#81C784"}},
        h(View,{style:{flexDirection:"row",justifyContent:"space-between",marginBottom:6}},h(Text,{style:{fontSize:14}},"இறுதி எடை:"),h(Text,{style:{fontWeight:"700"}},FK(polish))),
        h(View,{style:{flexDirection:"row",justifyContent:"space-between",marginBottom:6}},h(Text,{style:{fontSize:14}},"குவிண்டால்:"),h(Text,{style:{fontWeight:"700"}},quintal.toFixed(2)+" Q")),
        h(View,{style:{flexDirection:"row",justifyContent:"space-between",marginBottom:6}},h(Text,{style:{fontSize:14}},"விலை:"),h(Text,{style:{fontWeight:"700"}},F(Number(rate))+"/Q")),
        h(View,{style:{flexDirection:"row",justifyContent:"space-between",paddingTop:10,borderTopWidth:2,borderTopColor:"#66BB6A",marginTop:4}},
          h(Text,{style:{fontSize:18,fontWeight:"800"}},"💰 வருமானம்:"),h(Text,{style:{fontSize:26,fontWeight:"900",color:C.green}},F(revenue)))
      ):null,
      raw<=0?h(Text,{style:{fontSize:13,color:C.sub,marginTop:8,textAlign:"center"}},"பச்சை இருப்பு இல்லை — கொள்முதல் செய்யுங்கள்"):null
    )
  );}

function ProcessingPage(){
  return h(MarketPage);
}

// ═══ STOCK (BY VARIETY) ═══
function StockPage(){
  var _d=useState([]),stock=_d[0],setStock=_d[1];var _l=useState(true),ld=_l[0],setLd=_l[1];var _t=useState({}),totals=_t[0],setTotals=_t[1];
  var load=function(){setLd(true);Promise.all([API.getStockReport(),API.getProfitReport()]).then(function(r){if(r[0]&&!r[0].error)setStock(r[0]);if(r[1]&&!r[1].error)setTotals(r[1]);setLd(false);});};
  useEffect(function(){load();},[]);
  var totalStock=stock.reduce(function(s,v){return s+(v.stock||0);},0);
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:14,paddingBottom:100},refreshControl:h(RefreshControl,{refreshing:ld,onRefresh:load})},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:12}},"📦 இருப்பு"),
    h(LinearGradient,{colors:[C.goldD,C.gold,C.goldL],style:{borderRadius:22,padding:28,alignItems:"center",marginBottom:16}},
      h(View,{style:{width:60,height:60,borderRadius:30,marginBottom:8,backgroundColor:"rgba(255,255,255,.2)",alignItems:"center",justifyContent:"center"}},h(Text,{style:{fontSize:30}},"🟡")),
      h(Text,{style:{color:"rgba(255,255,255,.8)",fontSize:14,fontWeight:"700"}},"மொத்த இருப்பு"),
      h(Text,{style:{color:"#fff",fontSize:36,fontWeight:"900",marginTop:4}},FK(totalStock))),
    h(Text,{style:{fontSize:14,fontWeight:"800",color:C.sub,marginBottom:8}},"🟡 வகை வாரியாக:"),
    stock.map(function(v,i){return h(ACard,{key:v.id,delay:i*40},
      h(View,{style:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}},
        h(View,{style:{flex:1,marginRight:10}},h(Text,{style:{fontSize:15,fontWeight:"700",color:C.txt}},v.name_ta||v.name),h(Text,{style:{fontSize:10,color:C.sub,marginTop:2}},"வாங்கு: "+FK(v.bought)+"\nவிற்பனை: "+FK(v.sold))),
        h(View,{style:{backgroundColor:v.stock>0?C.green+"15":C.red+"15",paddingHorizontal:12,paddingVertical:8,borderRadius:14,minWidth:70,alignItems:"center"}},h(Text,{style:{fontSize:14,fontWeight:"900",color:v.stock>0?C.green:C.red}},FK(v.stock)))));}),
    h(View,{style:{flexDirection:"row",gap:10,marginTop:16}},
      h(GS,{label:"மொத்த கொள்முதல்",value:F(totals.totalPurchase||0),colors:["#00695C","#00897B"],delay:60}),
      h(GS,{label:"மொத்த விற்பனை",value:F(totals.totalSale||0),colors:["#4E342E","#6D4C41"],delay:100})));}

// ═══ REPORTS ═══
function ReportsPage(){
  var _d=useState({}),data=_d[0],setData=_d[1];var _l=useState(true),ld=_l[0],setLd=_l[1];
  useEffect(function(){setLd(true);API.getProfitReport().then(function(d){if(d&&!d.error)setData(d);setLd(false);});},[]);
  var profit=(data.totalSale||0)-(data.totalPurchase||0);
  return h(ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:14,paddingBottom:100},refreshControl:h(RefreshControl,{refreshing:ld,onRefresh:function(){API.getProfitReport().then(function(d){if(d)setData(d);});}})},
    h(Text,{style:{fontSize:22,fontWeight:"900",color:C.txt,marginBottom:14}},"📊 அறிக்கை"),
    h(LinearGradient,{colors:profit>=0?[C.greenD,"#388E3C"]:["#C62828","#E53935"],style:{borderRadius:22,padding:28,alignItems:"center",marginBottom:16}},
      h(Text,{style:{color:"rgba(255,255,255,.85)",fontSize:15,fontWeight:"700"}},profit>=0?"📈 லாபம்":"📉 நட்டம்"),
      h(Text,{style:{color:"#fff",fontSize:34,fontWeight:"900",marginTop:6}},F(Math.abs(profit)))),
    h(ACard,{delay:80},[["🛒 கொள்முதல்",F(data.totalPurchase||0),C.red],["💵 விற்பனை",F(data.totalSale||0),"#2E7D32"],["📦 இருப்பு",FK(data.stockKg||0),C.gold]].map(function(a){return h(View,{key:a[0],style:{flexDirection:"row",justifyContent:"space-between",paddingVertical:12,borderBottomWidth:1,borderBottomColor:"#F0E6D2"}},h(Text,{style:{fontSize:14,fontWeight:"600"}},a[0]),h(Text,{style:{fontSize:17,fontWeight:"900",color:a[2]}},a[1]));})));}

// ═══ TAB BAR ═══
function TabBar(p){return h(View,{style:{flexDirection:"row",backgroundColor:"#FFFDF7",borderTopWidth:1.5,borderTopColor:C.bdr,paddingTop:5,paddingBottom:Platform.OS==="android"?24:26}},
  p.tabs.map(function(t){var act=p.active===t.k;var clr=act?p.color:C.sub;return h(TouchableOpacity,{key:t.k,onPress:function(){p.onPress(t.k);},activeOpacity:.7,style:{flex:1,alignItems:"center",paddingVertical:3}},act?h(View,{style:{position:"absolute",top:0,width:22,height:3,borderRadius:2,backgroundColor:p.color}}):null,h(Text,{style:{fontSize:20}},t.i),h(Text,{style:{fontSize:9,fontWeight:act?"800":"600",color:clr,marginTop:1}},t.l));}));}

// ═══ MAIN ═══
function App(){
  var _mod=useState("farm"),mod=_mod[0],setMod=_mod[1];var _tab=useState("home"),tab=_tab[0],setTab=_tab[1];var _st=useState({}),st=_st[0],setSt=_st[1];
  useEffect(function(){API.getEmployees().then(function(d){if(d&&!d.error)setSt(function(p){return Object.assign({},p,{empCount:d.length});});});API.getProfitReport().then(function(d){if(d&&!d.error)setSt(function(p){return Object.assign({},p,d);});});},[mod,tab]);
  useEffect(function(){if(mod==="farm"&&["purchase","sales","stock","reports","processing","market"].indexOf(tab)!==-1)setTab("home");if(mod==="trade"&&["attendance","employees","salary","settings"].indexOf(tab)!==-1)setTab("home");},[mod]);
  var farmT=[{k:"home",i:"🏠",l:"முகப்பு"},{k:"attendance",i:"📋",l:"வருகை"},{k:"employees",i:"👥",l:"நபர்கள்"},{k:"salary",i:"💰",l:"சம்பளம்"},{k:"settings",i:"⚙️",l:"அமைப்பு"}];
  var tradeT=[{k:"home",i:"🏠",l:"முகப்பு"},{k:"purchase",i:"🛒",l:"வாங்கு"},{k:"sales",i:"🌱",l:"விதை"},{k:"market",i:"🏪",l:"சந்தை"},{k:"stock",i:"📦",l:"இருப்பு"}];
  var pages={home:mod==="farm"?h(FarmHome,{empCount:st.empCount||0,setTab:setTab}):h(TradeHome,{setTab:setTab,refresh:tab}),
    attendance:h(AttendancePage),employees:h(EmployeesPage),salary:h(SalaryPage),settings:h(SettingsPage),
    purchase:h(PurchasePage),sales:h(SalesPage),processing:h(ProcessingPage),market:h(MarketPage),stock:h(StockPage),reports:h(ReportsPage)};
  var sbH=Platform.OS==="android"?(RNBar.currentHeight||40):50;
  return h(View,{style:{flex:1,backgroundColor:C.bg}},
    h(StatusBar,{style:"light"}),
    h(View,{style:{height:sbH,backgroundColor:mod==="farm"?C.greenD:C.goldD}}),
    h(View,{style:{flexDirection:"row",backgroundColor:mod==="farm"?C.greenD:C.goldD,paddingHorizontal:14,paddingBottom:8}},
      [["farm","🌾 விவசாயம்"],["trade","🟡 மஞ்சள்"]].map(function(a){var act=mod===a[0];return h(TouchableOpacity,{key:a[0],onPress:function(){setMod(a[0]);},activeOpacity:.8,style:{flex:1,paddingVertical:11,alignItems:"center",backgroundColor:act?"rgba(255,255,255,.2)":"transparent",borderRadius:12,marginHorizontal:3}},h(Text,{style:{fontSize:15,fontWeight:"800",color:act?"#fff":"rgba(255,255,255,.5)"}},a[1]));})),
    h(View,{style:{flex:1}},pages[tab]||pages.home),
    h(TabBar,{tabs:mod==="farm"?farmT:tradeT,active:tab,color:mod==="farm"?C.green:C.gold,onPress:setTab}));
}

registerRootComponent(App);
