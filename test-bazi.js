var CYCLE=[
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥',
];
var d0 = Date.UTC(1984,3,16);
var d1 = Date.UTC(2000,0,1);
console.log('Days from 1984-04-16 to 2000-01-01:',(d1-d0)/86400000);
console.log('2000-01-01 cycle idx:',Math.floor((d1-d0)/86400000)%60);
console.log('CYCLE[38]:',CYCLE[38]);
console.log('Expected for 2000-01-01: 辛巳');
console.log('');
// Manual check: 甲子=0, 辛巳 should be at index 17
// 甲子=1984-04-16, 辛巳=?days?
// 辛巳 = day index 17 in CYCLE
// So: offset from 1984-04-16 = 17
// 1984-04-16 + 17 = 2000-01-01?
console.log('Is 2000-01-01 = 辛巳? Days:',(Date.UTC(2000,0,1)-Date.UTC(1984,3,16))/86400000);
console.log('17 % 60 =', 17%60);
console.log('(daysSince) % 60 =', Math.floor((Date.UTC(2000,0,1)-Date.UTC(1984,3,16))/86400000) % 60);
// OK so 2000-01-01 is 17 days after 甲子, so it's CYCLE[17] = 辛巳 ✓
// So the formula should be: CYCLE[(daysSince1984+base)%60]
// For 2000-01-01: (17+base)%60=17, so base=0
// Let me verify all dates:
var tests=[
  {y:2000,m:1,d:1,exp:'辛巳',expIdx:17},
  {y:2000,m:1,d:27,exp:'己未',expIdx:19},
  {y:2023,m:1,d:22,exp:'壬寅',expIdx:39},
  {y:2026,m:4,d:7,exp:'丁酉',expIdx:34},
  {y:1990,m:6,d:15,exp:'丙子',expIdx:12},
];
for(var i=0;i<tests.length;i++){
  var t=tests[i];
  var dn=Date.UTC(t.y,t.m-1,t.d);
  var days=Math.floor((dn-d0)/86400000);
  var idx=(days%60+60)%60;
  console.log(t.y+'-'+t.m+'-'+t.d+': days='+days+', idx='+idx+', CYCLE[idx]='+CYCLE[idx]+' (exp '+t.exp+', idx='+t.expIdx+') '+(CYCLE[idx]===t.exp?'OK':'FAIL'));
}
