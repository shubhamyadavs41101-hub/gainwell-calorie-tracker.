(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const DAY_KEY = () => new Date().toLocaleDateString("en-CA");
  const STORAGE_KEY = "gainwell_v1";
  const foodDB = [
    {name:"2 boiled eggs",cal:156,protein:12.6,unit:"serving"},
    {name:"1 boiled egg",cal:78,protein:6.3,unit:"egg"},
    {name:"Banana, medium",cal:105,protein:1.3,unit:"piece"},
    {name:"Milk, 250 ml",cal:150,protein:8,unit:"glass"},
    {name:"Curd, 100 g",cal:61,protein:3.5,unit:"100 g"},
    {name:"Paneer, 100 g",cal:265,protein:18,unit:"100 g"},
    {name:"Tofu, 100 g",cal:145,protein:15,unit:"100 g"},
    {name:"Roti, medium",cal:110,protein:3,unit:"roti"},
    {name:"Rice, cooked, 100 g",cal:130,protein:2.7,unit:"100 g"},
    {name:"Dal, 1 bowl",cal:180,protein:10,unit:"bowl"},
    {name:"Rajma, cooked, 1 bowl",cal:220,protein:13,unit:"bowl"},
    {name:"Chole, cooked, 1 bowl",cal:240,protein:12,unit:"bowl"},
    {name:"Soya chunks, 40 g dry",cal:138,protein:21,unit:"serving"},
    {name:"Oats, 60 g dry",cal:233,protein:10,unit:"serving"},
    {name:"Peanuts, 30 g",cal:170,protein:7.5,unit:"serving"},
    {name:"Roasted chana, 30 g",cal:120,protein:6,unit:"serving"},
    {name:"Almonds, 20 g",cal:116,protein:4.2,unit:"serving"},
    {name:"Poha, 1 plate",cal:280,protein:6,unit:"plate"},
    {name:"Upma, 1 bowl",cal:250,protein:6,unit:"bowl"},
    {name:"Idli, 2 pieces",cal:120,protein:4,unit:"serving"},
    {name:"Dosa, plain, 1 medium",cal:170,protein:4,unit:"dosa"},
    {name:"Vegetable sabzi, 1 bowl",cal:120,protein:3,unit:"bowl"},
    {name:"Potato, boiled, 100 g",cal:87,protein:1.9,unit:"100 g"},
    {name:"Apple, medium",cal:95,protein:0.5,unit:"piece"},
    {name:"Orange, medium",cal:62,protein:1.2,unit:"piece"},
    {name:"Peanut butter, 1 tbsp",cal:95,protein:3.5,unit:"tablespoon"},
    {name:"Whole wheat bread, 2 slices",cal:160,protein:6,unit:"serving"},
    {name:"Cooking oil, 1 tsp",cal:40,protein:0,unit:"teaspoon"},
    {name:"Whey protein, 1 scoop",cal:120,protein:24,unit:"scoop"}
  ];
  const defaults = {
    calorieTarget:2300, proteinTarget:100, currentWeight:55.5, goalWeight:70,
    entries:{}, weights:[], reminders:[
      {label:"Breakfast",time:"08:00",enabled:true},
      {label:"Morning snack",time:"11:00",enabled:true},
      {label:"Lunch",time:"13:30",enabled:true},
      {label:"Evening snack",time:"17:00",enabled:true},
      {label:"Dinner",time:"20:00",enabled:true}
    ]
  };
  let state = loadState();
  let selectedFood = foodDB[0];
  let photoDataUrl = null;
  let alarmTimer = null;

  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
  function loadState(){
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved ? {...clone(defaults), ...saved, entries:saved.entries||{}, weights:saved.weights||[], reminders:saved.reminders||clone(defaults.reminders)} : clone(defaults);
    } catch { return clone(defaults); }
  }
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function todayEntries(){ return state.entries[DAY_KEY()] || []; }
  function fmt(n){return Math.round(n).toLocaleString();}
  function dateLabel(){return new Date().toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric",year:"numeric"});}
  function totals(entries=todayEntries()){return entries.reduce((a,e)=>({cal:a.cal+Number(e.cal||0),protein:a.protein+Number(e.protein||0)}),{cal:0,protein:0});}

  function render(){
    $("todayLabel").textContent = dateLabel();
    const entries = todayEntries(), t=totals(entries);
    $("caloriesTotal").textContent=fmt(t.cal);
    $("proteinTotal").textContent=(Math.round(t.protein*10)/10).toString();
    $("caloriesTargetLabel").textContent=fmt(state.calorieTarget);
    $("remainingCalories").textContent=fmt(Math.max(0,state.calorieTarget-t.cal));
    $("caloriesBar").style.width=Math.min(100,t.cal/state.calorieTarget*100)+"%";
    $("proteinBar").style.width=Math.min(100,t.protein/state.proteinTarget*100)+"%";
    $("currentWeightLabel").textContent=Number(state.currentWeight).toFixed(1);
    $("weightInput").value=Number(state.currentWeight).toFixed(1);
    const progress=(Number(state.currentWeight)-55.5)/(state.goalWeight-55.5)*100;
    $("weightBar").style.width=Math.max(0,Math.min(100,progress))+"%";
    $("weightRemaining").textContent=Math.max(0,state.goalWeight-Number(state.currentWeight)).toFixed(1)+" kg to goal";
    const last=state.weights.slice(-5).reverse();
    $("weightHistory").textContent=last.length ? "Recent: "+last.map(w=>`${w.date}: ${w.weight} kg`).join(" · ") : "No weight history yet.";
    renderDiary(entries);
    renderFoodResults($("foodSearch").value);
    renderReminders();
    updateNotificationStatus();
  }
  function renderDiary(entries){
    const host=$("diary");
    if(!entries.length){host.innerHTML='<div class="empty">No foods logged yet. Search for a food above to get started.</div>';return;}
    const groups={};
    entries.forEach(e=>{(groups[e.meal] ||= []).push(e);});
    host.innerHTML=Object.entries(groups).map(([meal,items])=>`<div class="mealhead">${escapeHtml(meal)}</div>`+items.map(e=>`
      <div class="entry">
        <div class="grow"><div class="entry-name">${escapeHtml(e.name)}</div><div class="entry-meta">${e.portion} portion(s) · ${fmt(e.protein)} g protein</div></div>
        <div class="entry-val"><strong>${fmt(e.cal)} kcal</strong></div>
        <button class="xbtn" data-remove="${escapeHtml(e.id)}" aria-label="Remove ${escapeHtml(e.name)}">×</button>
      </div>`).join("")).join("");
    host.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>removeEntry(btn.dataset.remove)));
  }
  function renderFoodResults(query=""){
    const host=$("foodResults"), q=query.trim().toLowerCase();
    const matches=foodDB.filter(f=>!q || f.name.toLowerCase().includes(q)).slice(0,14);
    host.innerHTML=matches.length?matches.map((f,i)=>`<button type="button" class="food-option" data-food="${foodDB.indexOf(f)}"><span><strong>${escapeHtml(f.name)}</strong><small>${escapeHtml(f.unit)}</small></span><span style="text-align:right;white-space:nowrap"><strong>${f.cal} kcal</strong><small>${f.protein} g protein</small></span></button>`).join(""):'<div class="empty">No match. You can still enter your own calories and protein below.</div>';
    host.querySelectorAll("[data-food]").forEach(btn=>btn.addEventListener("click",()=>chooseFood(foodDB[Number(btn.dataset.food)])));
  }
  function chooseFood(food){
    selectedFood=food;
    $("selectedFoodLabel").value=food.name;
    $("customCalories").value=food.cal;
    $("customProtein").value=food.protein;
    $("portionInput").value="1";
  }
  function addEntry(name,cal,protein,meal,portion=1,photo=null){
    if(!name.trim() || !Number.isFinite(cal) || !Number.isFinite(protein) || cal<0 || protein<0 || portion<=0){alert("Please enter a food name, valid calories/protein and a portion greater than zero.");return false;}
    const day=DAY_KEY(); state.entries[day] ||= [];
    state.entries[day].push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),name:name.trim(),cal:Math.round(cal),protein:Math.round(protein*10)/10,meal,portion,photo:photo||null});
    saveState();render();return true;
  }
  function removeEntry(id){state.entries[DAY_KEY()]=todayEntries().filter(e=>e.id!==id);saveState();render();}
  function renderReminders(){
    $("reminders").innerHTML=state.reminders.map((r,i)=>`<div class="reminder">
      <label class="checkline"><input type="checkbox" data-enabled="${i}" ${r.enabled?"checked":""}> ${escapeHtml(r.label)}</label>
      <input aria-label="${escapeHtml(r.label)} reminder time" type="time" data-time="${i}" value="${escapeHtml(r.time)}">
      <span class="small">${r.enabled?"On":"Off"}</span>
    </div>`).join("");
  }
  function collectReminders(){
    state.reminders=state.reminders.map((r,i)=>({...r,enabled:$(`[data-enabled="${i}"]`).checked,time:$(`[data-time="${i}"]`).value||r.time}));
    saveState();scheduleNextReminder();renderReminders();
  }
  function updateNotificationStatus(){
    const status=$("notificationStatus"), btn=$("enableNotifications");
    if(!("Notification" in window)){status.textContent="This browser does not support notifications.";btn.disabled=true;return;}
    if(Notification.permission==="granted"){status.textContent="Notifications are allowed. Keep this app open for in-page reminder checks.";btn.textContent="Notifications enabled";btn.disabled=true;}
    else if(Notification.permission==="denied"){status.textContent="Notifications are blocked. Change this site's notification permission in your browser settings.";btn.textContent="Notifications blocked";btn.disabled=false;}
    else {status.textContent="Allow notifications to receive reminders while this app is open.";btn.textContent="Enable reminders";btn.disabled=false;}
  }
  async function enableNotifications(){
    if(!("Notification" in window)){alert("This browser does not support notifications.");return;}
    try{const p=await Notification.requestPermission();updateNotificationStatus();if(p==="granted"){await notify("GainWell reminders enabled","Your meal reminder schedule is ready.");scheduleNextReminder();}}
    catch(e){alert("Could not request notification permission. Make sure the app is served over HTTPS or localhost.");}
  }
  async function notify(title,body){
    if(!("Notification" in window)||Notification.permission!=="granted")return;
    try{
      if("serviceWorker" in navigator && location.protocol!=="file:"){
        const reg=await navigator.serviceWorker.getRegistration();
        if(reg && reg.showNotification){await reg.showNotification(title,{body,icon:"icon.svg",badge:"icon.svg",tag:"gainwell-reminder"});return;}
      }
      new Notification(title,{body});
    }catch(e){console.warn("Notification failed",e);}
  }
  function scheduleNextReminder(){
    if(alarmTimer)clearTimeout(alarmTimer);
    if(Notification.permission!=="granted")return;
    const now=new Date();
    const candidates=[];
    state.reminders.filter(r=>r.enabled).forEach(r=>{
      const [h,m]=r.time.split(":").map(Number);
      const d=new Date();d.setHours(h,m,0,0);
      if(d<=now)d.setDate(d.getDate()+1);
      candidates.push({date:d,reminder:r});
    });
    if(!candidates.length)return;
    candidates.sort((a,b)=>a.date-b.date);
    const next=candidates[0], delay=Math.max(1000,next.date-now);
    alarmTimer=setTimeout(async()=>{
      await notify("Time for "+next.reminder.label.toLowerCase(),"Log your meal in GainWell and keep working toward your nutrition goal.");
      scheduleNextReminder();
    },Math.min(delay,2147480000));
  }
  function initReminderInputs(){
    $("saveReminders").addEventListener("click",()=>{collectReminders();$("notificationStatus").textContent="Reminder schedule saved on this device.";});
    $("testReminder").addEventListener("click",()=>notify("GainWell test reminder","Notifications are working while this browser allows them."));
    $("enableNotifications").addEventListener("click",enableNotifications);
  }
  function exportData(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url;a.download="gainwell-backup-"+DAY_KEY()+".json";a.click();URL.revokeObjectURL(url);
  }

  $("foodSearch").addEventListener("input",e=>renderFoodResults(e.target.value));
  $("clearSearch").addEventListener("click",()=>{$("foodSearch").value="";renderFoodResults("");});
  $("addFood").addEventListener("click",()=>{
    const portion=Number($("portionInput").value),cal=Number($("customCalories").value),protein=Number($("customProtein").value);
    if(addEntry($("selectedFoodLabel").value,cal*portion,protein*portion,$("mealSelect").value,portion)){$("foodSearch").value="";renderFoodResults("");}
  });
  $("clearDay").addEventListener("click",()=>{if(confirm("Delete all food entries for today?")){state.entries[DAY_KEY()]=[];saveState();render();}});
  $("saveWeight").addEventListener("click",()=>{
    const n=Number($("weightInput").value);if(!Number.isFinite(n)||n<20||n>300){alert("Enter a valid weight in kilograms.");return;}
    state.currentWeight=n;const today=DAY_KEY();const existing=state.weights.find(w=>w.date===today);
    if(existing)existing.weight=n;else state.weights.push({date:today,weight:n});
    saveState();render();
  });
  $("exportBtn").addEventListener("click",exportData);
  $("photoInput").addEventListener("change",e=>{
    const file=e.target.files&&e.target.files[0];if(!file)return;
    if(!file.type.startsWith("image/")){alert("Please choose an image file.");return;}
    const reader=new FileReader();reader.onload=()=>{photoDataUrl=reader.result;$("photoPreview").src=photoDataUrl;$("photoPreview").style.display="block";};reader.readAsDataURL(file);
  });
  $("addPhotoMeal").addEventListener("click",()=>{
    const name=$("photoFoodName").value,cal=Number($("photoCalories").value),protein=Number($("photoProtein").value);
    if(!name.trim()||$("photoCalories").value===""||$("photoProtein").value===""){alert("Enter a meal name and estimated calories and protein. The photo alone cannot calculate nutrition in this version.");return;}
    if(addEntry("📷 "+name,cal,protein,$("photoMeal").value,1,photoDataUrl)){
      $("photoFoodName").value="";$("photoCalories").value="";$("photoProtein").value="";$("photoInput").value="";$("photoPreview").style.display="none";photoDataUrl=null;
    }
  });
  initReminderInputs();
  if("serviceWorker" in navigator && location.protocol!=="file:"){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("Service worker registration failed",err)));
  }
  render();
  scheduleNextReminder();
  // Best-effort in-page reminder checks for tabs left open; browser timers are not guaranteed when closed/suspended.
  setInterval(()=>{
    if(Notification.permission!=="granted")return;
    const now=new Date(), hhmm=now.toTimeString().slice(0,5), key=DAY_KEY()+"-"+hhmm;
    if(state._lastReminderKey===key)return;
    const match=state.reminders.find(r=>r.enabled&&r.time===hhmm);
    if(match){state._lastReminderKey=key;saveState();notify("Time for "+match.label.toLowerCase(),"Remember to eat and log your meal in GainWell.");}
  },30000);
})();