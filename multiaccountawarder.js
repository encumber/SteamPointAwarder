// ==UserScript==
// @name         Multi Account Awarder
// @version      2.1
// @description  Steam Multi Account Awarder
// @author       Nitoned
// @match        https://steamcommunity.com/*
// @match        https://*steampowered.com/*
// @connect      steamcommunity.com
// @connect      steampowered.com
// @license      AGPL-3.0
// @icon         https://store.akamai.steamstatic.com/public/images/applications/store/coin_single.png
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(() => {
    'use strict';
    //Bots
    let GBots = {};
    //Award History
    let GHistory = {};
    //Task
    let GTask = {};
    //Panel
    let GPanel = {};
    //Dict
    let GObjs = {};
    var pointType = "cheap"; //most awards per points (good for leveling/if the person has an excessive amount of awardable items)
    //let pointType = "expensive"; //most points per awards (good for low awardable type accounts)


    //init
    (() => {
        loadConf();

        graphGUI();
        flashBotList();
        flashHistoryList();

        const { panelMain, panelLeft } = GPanel;
        if (panelMain) {
            GPanel.panelMain = false;
            panelSwitch();
        }
        if (panelLeft) {
            GPanel.panelLeft = false;
            leftPanelSwitch();
        }
        if (!isEmptyObject(GTask)) {
            GTask.work = false;
        }
        appllyTask();

    })();

    //====================================================================================
    //Add Control Pannel

    function graphGUI() {
        function genButton(text, foo, enable = true) {
            const b = document.createElement('button');
            b.textContent = text;
            b.className = 'aam_button';
            b.disabled = !enable;
            b.addEventListener('click', foo);
            return b;
        }
        function genDiv(cls = 'aam_div') {
            const d = document.createElement('div');
            d.className = cls;
            return d;
        }
        function genA(text, url) {
            const a = document.createElement('a');
            a.textContent = text;
            a.className = 'aam_a';
            a.target = '_blank';
            a.href = url;
            return a;
        }
        function genInput(value, tips, number = false) {
            const i = document.createElement('input');
            i.className = 'aam_input';
            if (value) { i.value = value; }
            if (tips) { i.placeholder = tips; }
            if (number) {
                i.type = 'number';
                i.step = 100;
                i.min = 0;
            }
            return i;
        }
        function genTextArea(value, tips) {
            const i = document.createElement('textarea');
            i.className = 'aam_textarea';
            if (value) { i.value = value; }
            if (tips) { i.placeholder = tips; }
            return i;
        }
        function genCheckbox(name, checked = false) {
            const l = document.createElement('label');
            const i = document.createElement('input');
            const s = genSpace(name);
            i.textContent = name;
            i.type = 'checkbox';
            i.className = 'aam_checkbox';
            i.checked = checked;
            l.appendChild(i);
            l.appendChild(s);
            return [l, i];
        }
        function genSelect(choose = [], choice = null) {
            const s = document.createElement('select');
            s.className = 'aam_select';
            choose.forEach(([text, value]) => {
                s.options.add(new Option(text, value));
            });
            if (choice) { s.value = choice; }
            return s;
        }
        function genList(choose = [], choice = null) {
            const s = genSelect(choose, choice);
            s.className = 'aam_list';
            s.setAttribute('multiple', 'multiple');
            return s;
        }
        function genP(text) {
            const p = document.createElement('p');
            p.textContent = text;
            return p;
        }
        function genSpan(text = '    ') {
            const s = document.createElement('span');
            s.textContent = text;
            return s;
        }
        const genSpace = genSpan;
        function genBr() {
            return document.createElement('br');
        }
        function genHr() {
            return document.createElement('hr');
        }
        function genMidBtn(text, foo) {
            const a = document.createElement('a');
            const s = genSpan(text);
            a.className = 'btn_profile_action btn_medium';
            a.addEventListener('click', foo);
            a.appendChild(s);
            return [a, s];
        }

        const btnArea = document.querySelector('.profile_header_actions');
        const [btnSwitch, bSwitch] = genMidBtn('🏆', panelSwitch);
        btnArea.appendChild(genSpace());
        btnArea.appendChild(btnSwitch);
        btnArea.appendChild(genSpace());

        //const panelArea = document.querySelector('.profile_customization_area');
        const panelArea = document.querySelector('.profile_leftcol');
        const panelMain = genDiv('aam_panel');
        panelMain.style.display = 'none';
        //const pointheader = genDiv('aam_customization_header');
        //panelArea.appendChild(pointheader);

        const busyPanel = genDiv('aam_busy');
        const busyPanelContent = genDiv('aam_busy_content');
        const busyMessage = genP('Loading...');
        const busyImg = new Image();
        busyImg.src = 'https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif';

        busyPanelContent.appendChild(busyMessage);
        busyPanelContent.appendChild(busyImg);

        busyPanel.appendChild(busyPanelContent);

        panelMain.appendChild(busyPanel);

        const workPanel = genDiv('aam_busy aam_work');
        const workLog = genTextArea('', 'Log',);
        const workHide = genButton('❌ Close', () => { workScreen(false, null); }, true);

        workPanel.appendChild(workLog);
        workPanel.appendChild(workHide);

        panelMain.appendChild(workPanel);

        const leftPanel = genDiv('aam_left');
        const accountPanel = genDiv('aam_account');
        const accountTitle = genSpan('Accounts:');
        const accountList = genList([], null);
        const accountBtns = genDiv('aam_btns');
        const acAdd = genButton('➕ Current', accountAdd);
        const acDel = genButton('➖ Remove', accountDel);
        const acUpdate = genButton('🔄 Refresh', flashAllAccounts);

        accountBtns.appendChild(acAdd);
        accountBtns.appendChild(acDel);
        accountBtns.appendChild(acUpdate);

        accountPanel.appendChild(accountTitle);
        accountPanel.appendChild(genBr());
        accountPanel.appendChild(accountList);
        accountPanel.appendChild(accountBtns);

        leftPanel.appendChild(accountPanel);

        const historyPanel = genDiv('aam_history');
        historyPanel.style.display = 'none';

        const historyTitle = genSpan('History:');
        const historyList = genList([], null);
        const historyBtns = genDiv('aam_btns');
        const hsProfile = genButton('🌏 Profile', showProfile);
        const hsDelete = genButton('➖ Remove', deleteHistory);
        const hsClear = genButton('🗑️ Clear', clearHistory);
        const hsReload = genButton('🔄 Refresh', flashHistoryList);

        historyBtns.appendChild(hsProfile);
        historyBtns.appendChild(hsDelete);
        historyBtns.appendChild(hsClear);
        historyBtns.appendChild(hsReload);

        historyPanel.appendChild(historyTitle);
        historyPanel.appendChild(genBr());
        historyPanel.appendChild(historyList);
        historyPanel.appendChild(historyBtns);

        leftPanel.appendChild(historyPanel);
        panelMain.appendChild(leftPanel);


        const awardPanel = genDiv('aam_award');
        const feedbackLink = genA('Feedback', 'https://github.com/ValveIndex/SteamPointAwarder/issues');
        const awardBot = genSelect([['---Not Selected---', '']], null);
        const awardSteamID = genInput('', 'Steam ID 64', false);
        const awardPoints = genInput('', 'Points Recieved', true);
        const [awardCProfile, awardProfile] = genCheckbox('Profile', true);
        const [awardCRecommand, awardRecommand] = genCheckbox('Review', true);
        const [awardCScreenshot, awardScreenshot] = genCheckbox('Screenshot', true);
        //const [awardCGuide, awardGuide] = genCheckbox('Guide', true);
       // const [awardCVideo, awardVideo] = genCheckbox('Video', true);
        //const [awardCWorkshop, awardWorkshop] = genCheckbox('Workshop', true);
        const [awardCImage, awardImage] = genCheckbox('Artwork', true);
        const awardBtns1 = genDiv('aam_btns');
        const awardBtnCurrent = genButton('🤵 Current User', getCurrentProfile);
	//Currently Broken
        //const awardBtnCalc = genButton('📊 Calculate', calcAwardItems);
        const awardBtns2 = genDiv('aam_btns');
        const awardBtnSet = genButton('Confirm', applyAwardConfig);
        const awardBtnReset = genButton('Reset', restoreAwardConfig);
        const hSwitch = genButton('History', leftPanelSwitch);
        const awardBtns3 = genDiv('aam_btns aam_award_btns');
        const awardBtnStart = genButton('✅ Start', startAward, false);
        const awardBtnStop = genButton('⛔ Stop', stopAward, false);
        const awardStatus = genSpan('');
        //const pointTypeList = genList(["cheap", "expensive"], pointType);

  if (pointType === "cheap") {
         var pointTypeNum = '1200';
        } else if (pointType === "expensive") {
         var pointTypeNum = '6600';
        }

        const panelMain2 = genDiv('profile_customization_header headeroverried profile_customization');
        let panel2Message = genP('Steam Points Awarder: ' + pointTypeNum + ' points per item');
        panelMain2.style.display = 'none';
        panelArea.insertBefore(panelMain2, panelArea.firstChild);
        panelMain2.appendChild(panel2Message)
        panelMain2.appendChild(panelMain)
        panelMain2.appendChild(genSpace())


        awardBtns1.appendChild(awardBtnCurrent);
        awardPanel.appendChild(genBr());

        awardBtns2.appendChild(awardBtnSet);
        awardBtns2.appendChild(awardBtnReset);
        awardBtns2.appendChild(hSwitch);

        awardBtns3.appendChild(awardBtnStart);
        awardBtns3.appendChild(awardBtnStop);
        awardBtns3.appendChild(awardStatus);

        awardPanel.appendChild(genSpan('Bot Account：'));
        awardPanel.appendChild(feedbackLink);
        //awardPanel.appendChild(genBr());
        awardPanel.appendChild(awardBot);
        awardPanel.appendChild(genSpan('Send To (SteamID):'));
        //awardPanel.appendChild(genBr());
        awardPanel.appendChild(awardSteamID);
        awardPanel.appendChild(awardBtns1);
        awardPanel.appendChild(genSpan('Points Recieved：'));
        //awardPanel.appendChild(genBr());
        awardPanel.appendChild(awardPoints);
        awardPanel.appendChild(genSpan('Award Types：'));
        awardPanel.appendChild(genBr());
        awardPanel.appendChild(awardCProfile);
        awardPanel.appendChild(awardCRecommand);
        awardPanel.appendChild(genBr());
        awardPanel.appendChild(awardCScreenshot);
        awardPanel.appendChild(awardCImage);
        //awardPanel.appendChild(genBr());
        //awardPanel.appendChild(awardCGuide);
        //awardPanel.appendChild(awardCVideo);
        //awardPanel.appendChild(genBr());
        //awardPanel.appendChild(awardCWorkshop);
        awardPanel.appendChild(genBr());
        awardPanel.appendChild(awardBtns2);
        awardPanel.appendChild(genBr());
        awardPanel.appendChild(awardBtns3);

        panelMain.appendChild(awardPanel);

        const panelFix = document.querySelector(".profile_customization_area");
        const panelFix2 = document.querySelector(".profile_customization");
        Object.assign(GObjs, {
            bSwitch, hSwitch, panelMain, panelMain2, panelFix, panelFix2,
            busyPanel, busyMessage, workPanel, workLog, workHide,
            accountPanel, accountList, historyPanel, historyList,
            awardBot, awardSteamID, awardPoints, awardStatus,
            awardProfile, awardRecommand, awardScreenshot, awardImage,
            awardBtnStart, awardBtnStop, awardBtnSet, awardBtnReset
        });
    }
    //Panel display switch
    function panelSwitch() {
        const { bSwitch, panelMain, panelMain2, panelFix, panelFix2 } = GObjs;

        if (GPanel.panelMain !== true) {
            panelMain.style.display = '';
            panelMain2.style.display = '';
            //panelFix.style.padding = "1em 0em 0em 0em";
            bSwitch.textContent = '🏆';
            GPanel.panelMain = true;
            GPanel.panelMain2 = true;
            try {
                panelFix.style.padding = "1em 0em 0em 0em";
                panelFix2.style.display = '';
            } catch {}
        } else {
            panelMain.style.display = 'none';
            panelMain2.style.display = 'none';
            bSwitch.textContent = '🏆';
            GPanel.panelMain = false;
            GPanel.PanelMain2 = false;
            try {
            panelFix.style.padding = "0em 0em 0em 0em";
                panelFix2.style.display = 'none';
            } catch {}
        }
        GM_setValue('panel', GPanel);
    }
    //Left panel toggle
    function leftPanelSwitch() {
        const { hSwitch, accountPanel, historyPanel } = GObjs;
        if (GPanel.panelLeft !== true) {
            accountPanel.style.display = 'none';
            historyPanel.style.display = '';
            hSwitch.textContent = 'Bots';
            GPanel.panelLeft = true;
        } else {
            historyPanel.style.display = 'none';
            accountPanel.style.display = '';
            hSwitch.textContent = 'History';
            GPanel.panelLeft = false;
        }
        GM_setValue('panel', GPanel);
    }
    //Add Account
    function accountAdd() {
        let v_nick, v_token, v_steamID;
        loadScreen(true, 'Get login...');
        getMySteamID()
            .then(({ nick, steamID }) => {
                v_nick = nick;
                v_steamID = steamID;
                loadScreen(true, 'Get Token...');
                return getToken();
            })
            .then((tk) => {
                v_token = tk;
                loadScreen(true, 'Get Points...');
                return getPoints(v_steamID, tk);
            })
            .then((points) => {
                showAlert('Success', `Added Successfully\nAvailable Points: ${points}`, true);
                GBots[v_steamID] = { nick: v_nick, token: v_token, points }
                GM_setValue('bots', GBots);
                flashBotList();
            })
            .catch((reason) => {
                showAlert('Error', reason, false);
            }).finally(() => {
                loadScreen(false, null);
            });
    }
    //Remove Account
    function accountDel() {
        const { accountList } = GObjs;
        if (accountList.selectedIndex >= 0) {
            showConfirm('Confirm', 'Are you sure you want to remove the selected account？', () => {
                let i = 0;
                for (const opt of accountList.selectedOptions) {
                    delete GBots[opt.value];
                    i++;
                }
                flashBotList();
                GM_setValue('bots', GBots);
                showAlert('Alert', `Removed ${i} accounts`, true);
            }, null);
        } else {
            showAlert('Error', 'No accounts were selected', false);
        }
    }
    //Refresh Accounts
    async function flashAllAccounts() {
        //Refresh Points
        function makePromise(sid, tk) {
            return new Promise((resolve, reject) => {
                getPoints(sid, tk)
                    .then((points) => {
                        GBots[sid].points = points;
                        loadScreen(true, `Progress： ${++fin} / ${count}`);
                    }).catch((reason) => {
                        GBots[sid].points = -1;
                        // GBots[sid].nick = 'Failed';
                        loadScreen(true, `${sid} Error： ${reason}`);
                    }).finally(() => {
                        GM_setValue('bots', GBots);
                        resolve();
                    });
            });
        }
        let count = 0, fin = 0;
        for (const _ in GBots) {
            count++;
        }
        if (count > 0) {
            loadScreen(true, 'Loading Points...');
            const pList = [];
            for (const steamID in GBots) {
                const { token } = GBots[steamID];
                pList.push(makePromise(steamID, token));
            }
            Promise.all(pList)
                .finally(() => {
                    loadScreen(false, null);
                    flashBotList();
                    if (fin >= count) {
                        showAlert('Success', 'Points refreshed', true);
                    } else {
                        showAlert('Error', 'Refresh failed, any displayed as [-1] have failed', true);
                    }
                });
        } else {
            showAlert('Error', 'Accounts list is empty', false);
        }
    }
    //Refresh Account List
    function flashBotList() {
        const { bot } = GTask;
        const { accountList, awardBot } = GObjs;
        accountList.options.length = 0;
        awardBot.options.length = 0;
        awardBot.options.add(new Option('---Not Selected---', ''))
        let i = 1;
        let flag = false;
        if (!isEmptyObject(GBots)) {
            for (const steamID in GBots) {
                const { nick, points } = GBots[steamID];
                const pointsStr = parseInt(points).toLocaleString();
                accountList.options.add(new Option(`${i} | ${nick} | ${steamID} | ${pointsStr} Points`, steamID));
                awardBot.options.add(new Option(`${i++} | ${nick} | ${pointsStr} Points`, steamID))
                if (steamID === bot) {
                    flag = true;
                    awardBot.selectedIndex = i - 1;
                }
            }
        } else {
            accountList.options.add(new Option('-- If there are no accounts, Add current account --', ''));
        }
        if ((!isEmptyObject(GTask)) && (!flag)) {
            GTask = {};
            GM_setValue('task', GTask);
            appllyTask();
            showAlert('Alert', 'The robot account has been modified, and the tipping settings have been reset!', false);
        }
    }
    //Refresh the history
    function flashHistoryList() {
        const { historyList } = GObjs;
        historyList.options.length = 0;
        let i = 1;
        if (!isEmptyObject(GHistory)) {
            for (const steamID in GHistory) {
                const [nick, points] = GHistory[steamID];
                const pointsStr = parseInt(points).toLocaleString();
                historyList.options.add(new Option(`${i++} | ${steamID} | ${pointsStr} Points | ${nick.replace(/([﷽⎛⎞])/g, '░')}`, steamID));
            }
        } else {
            historyList.options.add(new Option('-- There is no history, it will automatically update once awarding starts --', ''));
        }
    }
    //historical record points
    function addHistory(steamID, nick, points) {
        if (GHistory[steamID] !== undefined) {
            GHistory[steamID] = [nick, GHistory[steamID][1] + points];
        } else {
            GHistory[steamID] = [nick, points];
        }
        GM_setValue('history', GHistory);
    }
    //Get current profile
    function getCurrentProfile() {
        const { awardSteamID } = GObjs;
        awardSteamID.value = g_rgProfileData.steamid;
    }
    //Calculate award items

    function calcAwardItems() {
        const { awardSteamID } = GObjs;
        const steamID = awardSteamID.value;
        if (steamID === '') {
            showAlert('Error', 'No SteamID！', false);
        } else {
            loadScreen(true, 'Loading Profile...');
            getProfile(steamID)
                .then(([succ, nick]) => {
                    if (succ) {
                        loadScreen(true, 'Stats can be rewarded in the project...');
                        const pList = [
                            getAwardCounts(steamID, 'r'),
                            getAwardCounts(steamID, 's'),
                            getAwardCounts(steamID, 'i')
                            //getAwardCounts(steamID, 'g'),
                            //getAwardCounts(steamID, 'v'),
                            //getAwardCounts(steamID, 'w')
                        ];
                        Promise.all(pList)
                            .then((result) => {
                                const data = {};
                                let sum = 0;
                                for (const [type, succ, count] of result) {
                                    if (succ) {
                                        const points = count * 6600;
                                        data[type] = `${count} Can be awarded：${points.toLocaleString()} Points`;
                                        sum += points;
                                    } else {
                                        data[type] = 'Read Error';
                                    }
                                }
                                let text = `<p>Username：${nick}</p><p>Reviews：${data.r}</p><p>Screenshots：${data.s}</p><p>Artworks：${data.i}</p><p>Total Points：${sum.toLocaleString()} Points</p><p>*not 100% accurate*</p>`
                                showAlert('Alert', text, true);
                            })
                            .finally(() => {
                                loadScreen(false, null);
                            });
                    } else {
                        showAlert('Error', 'Account does not exist, check if SteamID is correct [🤵Current User] to set automatically', false);
                        loadScreen(false, null);
                    }
                })
                .catch((reason) => {
                    showAlert('Error', `<p>Network error, read profile failed</p><p>${reason}</p>`, false)
                    loadScreen(false, null);
                });
        }
    }
    //View Profile
    function showProfile() {
        const { historyList } = GObjs;
        const i = historyList.selectedIndex;
        if (i > -1) {
            const { value } = historyList.options[i];
            if (value != '') {
                window.open(`https://steamcommunity.com/profiles/${value}`);
            }
        } else {
            showAlert('Alert', 'History is not checked!', false);
        }
    }
    //clear history
    function clearHistory() {
        if (!isEmptyObject(GHistory)) {
            showConfirm('Confirm', 'Are you sure you want to clear award history?', () => {
                GHistory = {};
                flashHistoryList();
                GM_setValue('history', GHistory);
                showAlert('Alert', 'Cleared successfully', true);
            }, null);
        } else {
            showAlert('Alert', 'History is empty！', false);
        }
    }
    //delete history
    function deleteHistory() {
        const { historyList } = GObjs;
        if (historyList.selectedIndex >= 0) {
            showConfirm('Confirm', 'Are you sure you want to delete the selected award history?', () => {
                let i = 0;
                for (const opt of historyList.selectedOptions) {
                    delete GHistory[opt.value];
                    i++;
                }
                flashHistoryList();
                GM_setValue('history', GHistory);
                showAlert('Alert', `${i} History deleted`, true);
            }, null);
        } else {
            showAlert('Alert', 'History has not been selected!', false);
        }
    }
    //Save award settings
    function applyAwardConfig() {
        const {
            awardBtnStart, awardBtnStop,
            awardBot, awardSteamID, awardPoints,
            awardProfile, awardRecommand, awardScreenshot, awardImage
        } = GObjs;

        awardBtnStart.disabled = awardBtnStop.disabled = true;

        let bot = awardBot.value;
        let points = parseInt(awardPoints.value);
        let steamID = String(awardSteamID.value).trim();

        let type = 0;
        if (!awardProfile.checked) { type += 1; }
        if (!awardRecommand.checked) { type += 2; }
        if (!awardScreenshot.checked) { type += 4; }
        //if (!awardGuide.checked) { type += 5; }
        //if (!awardVideo.checked) { type += 6; }
        //if (!awardWorkshop.checked) { type += 7; }
        if (!awardImage.checked) { type += 8; }

        if (bot == '') {
            showAlert('Error', 'No bots have been selected!', false);
        } else if (steamID === '') {
            showAlert('Error', 'No SteamID to Award，Use [💬Current User]', false);
        } else if (!steamID.match(/^\d+$/)) {
            showAlert('Error', 'SteamID is invalid，Use [💬Current User]', false);
        } else if (points !== points || points < 100) {
            showAlert('Error', 'Points can only be a number', false);
        } else if (type === 15) {
            showAlert('Error', 'Type not selected', false);
        } else {
            points = Math.ceil(points / 100) * 100;
            GTask = { bot, steamID, points, type, work: false, nick: null };
            awardBtnStart.disabled = awardBtnStop.disabled = false;
            GM_setValue('task', GTask);
            showAlert('Alert', 'Settings Saved [✅ Start Awarding]', true);
        }
    }
    //Reset Award Settings
    function restoreAwardConfig() {
        showConfirm('Confirm', 'Are you sure you want to reset settings?', () => {
            GTask = {};
            GM_setValue('task', GTask);
            appllyTask();
            showAlert('Alert', 'Settings cleared', true);
        }, null);
    }
    //Apply Settings
    function appllyTask() {
        const {
            awardBtnStart, awardBtnStop,
            awardBot, awardSteamID, awardPoints,
            awardProfile, awardRecommand, awardScreenshot, awardImage
        } = GObjs;
        const { bot, steamID, points, type } = GTask;

        awardBtnStart.disabled = awardBtnStop.disabled = isEmptyObject(GTask);

        awardBot.value = bot ? bot : '';
        awardSteamID.value = steamID ? steamID : '';
        awardPoints.value = points ? points : '';

        awardProfile.checked = !Boolean(type & 1);
        awardRecommand.checked = !Boolean(type & 2);
        //awardGuide.checked = !Boolean(type & 5);
        awardScreenshot.checked = !Boolean(type & 4);
        //awardWorkshop.checked = !Boolean(type & 7);
       // awardVideo.checked = !Boolean(type & 6);
        awardImage.checked = !Boolean(type & 8);
    }
    //Start Awarding
    async function startAward() {
        if (isEmptyObject(GTask)) {
            showAlert('Error', 'Missing Data', false);
            return;
        }
        const { steamID, work, points, bot, nick: taskNick } = GTask;
        const { nick: botNick } = GBots[bot];
        const pointsStr = parseInt(points).toLocaleString();

        if (!work) {
            spaceLine(1);
            if (!taskNick) {
                loadScreen(true, 'Reading Profile to Award');
                getProfile(steamID)
                    .then(([succ, nickName]) => {
                        if (succ) {
                            GTask.work = true;
                            GTask.nick = nickName;
                            GM_setValue('task', GTask);
                            print(`Award Settings：\n〖Username：${nickName}，Estimated recieved：${pointsStr} Points，Bot：${botNick}〗`);
                            print('Awarding starts after 2s, click [⛔ Stop Awarding] to terminate in advance!');
                            workScreen(true);
                            setTimeout(() => {
                                autoAward();
                            }, 2000);
                        } else {
                            print('No Profile Found', 'E');
                            showAlert('Error', 'Make sure SteamID is correct<br>Reccomend [🤵Current User] for better results', false);
                        }
                    })
                    .catch((reason) => {
                        showAlert('Error', `<p>Network error, read profile failed</p><p>${reason}</p>`, false)
                    }).finally(() => {
                        loadScreen(false, null);
                    });
            } else {
                GTask.work = true;
                GM_setValue('task', GTask);
                print(`〖Username：${taskNick}，Estimated recieved：${pointsStr} Points，Bot：${botNick}〗`);
                print('Awarding starts after 2s, click [⛔ Stop Awarding] to terminate in advance!');
                workScreen(true);
                setTimeout(() => {
                    autoAward();
                }, 2000);
            }
        } else {
            print('Awarding Started');
        }
    }
    //Stop Awarding
    async function stopAward() {
        if (isEmptyObject(GTask)) {
            showAlert('Error', 'Missing Data', false);
            return;
        }
        const { work } = GTask;
        if (work) {
            spaceLine(4);
            print('Manually stop Awarding by Clicking [❌ Close]');
            GTask.work = false;
            GM_setValue('task', GTask);
            showStatus('Stopped', false);
        } else {
            showAlert('Error', 'Awarding hasn\'t started', false);
        }
    }
    //Awards Dict
    /*
    const reactionsDict1 = {
        1: 300, 2: 300, 3: 300, 4: 300, 5: 300, 6: 300, 7: 300, 8: 300, 12: 300, 18: 300, 21: 300, 23: 300
    };
    const reactionValues1 = [
        300, 300, 300, 300, 300, 300, 300, 300, 300,
        300, 300, 300
    ];
    const reactionIDs1 = [
        1, 2, 3, 4, 5, 6, 7, 8, 12,
        18, 21, 23
    ];

    const reactionsDict2 = {
        1: 300, 2: 300, 3: 300, 4: 300, 5: 300, 6: 300, 7: 300, 8: 300, 9: 600,
        10: 1200, 11: 2400, 12: 300, 13: 2400, 14: 600, 15: 1200, 16: 600,
        17: 4800, 18: 300, 19: 600, 20: 1200, 21: 300, 22: 600, 23: 300
    };
    const reactionValues2 = [
        300, 300, 300, 300, 300, 300, 300, 300, 600, 1200, 2400, 300,
        2400, 600, 1200, 600, 4800, 300, 600, 1200, 300, 600, 300
    ];
    const reactionIDs2 = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
        13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
    ];

    let reactionsDict = reactionsDict1
    let reactionIDs = reactionIDs1
    let reactionValues = reactionValues1
    */
    if (pointType === "cheap") {
    var reactionsDict = {
        1: 300, 2: 300, 3: 300, 4: 300, 5: 300, 6: 300, 7: 300, 8: 300, 12: 300, 18: 300, 21: 300, 23: 300
    };
    var reactionValues = [
        300, 300, 300, 300, 300, 300, 300, 300, 300,
        300, 300, 300
    ];
    var reactionIDs = [
        1, 2, 3, 4, 5, 6, 7, 8, 12,
        18, 21, 23
    ];
    } else if (pointType === "expensive") {
    var reactionsDict = {
        1: 300, 2: 300, 3: 300, 4: 300, 5: 300, 6: 300, 7: 300, 8: 300, 9: 600,
        10: 1200, 11: 2400, 12: 300, 13: 2400, 14: 600, 15: 1200, 16: 600,
        17: 4800, 18: 300, 19: 600, 20: 1200, 21: 300, 22: 600, 23: 300
    };
    var reactionValues = [
        300, 300, 300, 300, 300, 300, 300, 300, 600, 1200, 2400, 300,
        2400, 600, 1200, 600, 4800, 300, 600, 1200, 300, 600, 300
    ];
    var reactionIDs = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
        13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
    ];
    }
    //Auto Award
    async function autoAward() {
        //Award Type
        const reactionType = {
            'p': ['3', 'Profile'], 'r': ['1', 'Reviews'], 's': ['2', 'Screenshots'], 'i': ['2', 'Artwork']
        };
        const { bot, steamID, type, points: pointsGoal, nick: taskNick } = GTask;
        const { nick: botNick, token } = GBots[bot];

        appllyTask();
        addHistory(steamID, taskNick, 0);
        showStatus('Start', true);
        let pointsLeft = pointsGoal;

        if (token) {
            const workflow = [];
            if (!Boolean(type & 8)) { workflow.push('i') }; //Artwork
            if (!Boolean(type & 4)) { workflow.push('s') }; //Screenshots
            if (!Boolean(type & 2)) { workflow.push('r') }; //Reviews
            if (!Boolean(type & 1)) { workflow.push('p') }; //Profile
           // if (!Boolean(type & 5)) { workflow.push('g') }; //Guides
            //if (!Boolean(type & 6)) { workflow.push('v') }; //Videos
            //if (!Boolean(type & 5)) { workflow.push('w') }; //Workshop

            while (GTask.work && workflow.length > 0) {
                const award_type = workflow.pop();
                const [target_type, target_name] = reactionType[award_type];
                let process = genProgressBar((pointsGoal - pointsLeft) / pointsGoal * 100);

                spaceLine(3);
                print(`[${target_name}] Started，Remaining/Total：${pointsLeft.toLocaleString()}/${pointsGoal.toLocaleString()}`);
                print(`Progress：${process}`);
                spaceLine(3);

                let coast = 0;

                if (target_type === '3') { //Profile
                    let GoldReactions = null;
                    for (let i = 0; i < 3; i++) { //Retry 3 times
                        if (GoldReactions === null) { //List Empty, retry award
                            const [succOld, oldReactions] = await getAwardRecords(token, target_type, steamID);
                            if (!succOld) {
                                print('Failed to load awards');
                                continue;
                            }
                            GoldReactions = oldReactions;
                            const todoReactions = selectFitableReactions(pointsLeft, GoldReactions);
                            if (todoReactions.length === 0) {
                                print(`[${target_name}] No awards left，skipping`);
                                break;
                            }
                            coast = sumReactionsPoints(todoReactions);
                            print(`[${target_name}] will be awarded：${todoReactions.length} awards，Points：${coast.toLocaleString()}`)
                            const plist = [];
                            for (const id of todoReactions) {
                                plist.push(sendAwardReaction(token, target_type, steamID, id));
                            }
                            print('Awarding...');
                            const result = await Promise.all(plist);
                            const [succ, fail] = countSuccess(result);
                            print(`Sent/Failed：${succ} / ${fail}`);
                        }
                        //Count the new award list and calculate the awarded points
                        const [succNew, newReactions] = await getAwardRecords(token, target_type, steamID);
                        if (!succNew) {
                            print('Failed to load awards，retrying after 2s');
                            await aiosleep(2000);
                            continue;
                        }
                        const diffReactions = filterDiffReactions(newReactions, GoldReactions);
                        coast = sumReactionsPoints(diffReactions);
                        pointsLeft -= coast;
                        addHistory(steamID, taskNick, coast);
                        print(`[${target_name}] Successfully awarded：${diffReactions.length} awards，Points：${coast.toLocaleString()}`);
                        break;
                    }
                    GTask.points = pointsLeft;
                    if (pointsLeft <= 0) {
                        GTask.work = false;
                    }
                    GM_setValue('task', GTask);
                    process = genProgressBar((pointsGoal - pointsLeft) / pointsGoal * 100);

                    spaceLine(3);
                    print(`[${target_name}] Awarding stared，Remaining / Total：${pointsLeft.toLocaleString()} / ${pointsGoal.toLocaleString()}`);
                    print(`Progress：${process}`);
                    spaceLine(3);

                    print('Updating points balances');

                    await getPoints(bot, token)
                        .then((p) => {
                            GBots[bot].points = p;
                            GM_setValue('bots', GBots);
                            print(`[${botNick}] has，${p.toLocaleString()} Points left`);
                            if (p < 300) {
                                print(`[${botNick}] has no points, stopping`);
                                GTask.work = false;
                            }
                        }).catch((r) => {
                            print(`[${botNick}] Points update failed：${r}`);
                        });


                } else { //Screenshots
                    let page = 1;
                    while (GTask.work) {
                        let j = 0;
                        print('Getting Awarded Items');
                        const [succ, items] = await getAwardItems(steamID, award_type, page++);
                        if (!succ) {
                            page--;
                            if (++j < 3) {
                                print(`Failed to load awardable items, retrying after 2s`);
                                await aiosleep(2000);
                                continue;
                            } else {
                                print(`Failed to load awardable items, skipping...`);
                                break;
                            }
                        }
                        if (items.length === 0) {
                            print(`[${target_name}] List is empty`);
                            break;
                        }

                        print(`[${target_name}] Successfully loaded ${items.length} items`);

                        for (const itemID of items) {

                            print(`[${target_name}] Item ID：${itemID}`);
                            let GoldReactions = null;

                            for (let i = 0; i < 3; i++) {
                                if (GoldReactions === null) { //The old award list is empty, re-read and award
                                    const [succOld, oldReactions] = await getAwardRecords(token, target_type, itemID);
                                    if (!succOld) {
                                        print('Failed to get awardable items, try again...');
                                        continue;
                                    }
                                    GoldReactions = oldReactions;
                                    const todoReactions = selectFitableReactions(pointsLeft, GoldReactions);
                                    if (todoReactions.length === 0) {
                                        print(`[${target_name}] No suitablke awards，Skipping...`);
                                        break;
                                    }
                                    coast = sumReactionsPoints(todoReactions);
                                    print(`[${target_name}] Will recieve：${todoReactions.length} awards，Points：${coast.toLocaleString()}`)
                                    const plist = [];
                                    for (const id of todoReactions) {
                                        plist.push(sendAwardReaction(token, target_type, itemID, id));
                                    }
                                    print('Sending Awards...');
                                    const result = await Promise.all(plist);
                                    const [succ, fail] = countSuccess(result);
                                    print(`Sent/Fail：${succ} / ${fail}`);
                                }
                                print('*Waiting 2s to prevent ratelimit.*');
                                await asleep(2000);
                                //Count the new award list and calculate the awarded points
                                const [succNew, newReactions] = await getAwardRecords(token, target_type, itemID);
                                if (!succNew) {
                                    print('Failed to get awardable items, try again...');
                                    continue;
                                }
                                const diffReactions = filterDiffReactions(newReactions, GoldReactions);
                                coast = sumReactionsPoints(diffReactions);
                                pointsLeft -= coast;
                                addHistory(steamID, taskNick, coast);
                                print(`[${target_name}] Successfully Awarded：${diffReactions.length} awards，Points：${coast.toLocaleString()}`);
                                break;
                            }
                            GTask.points = pointsLeft;
                            if (pointsLeft <= 0) {
                                GTask.work = false;
                            }
                            GM_setValue('task', GTask);
                            process = genProgressBar((pointsGoal - pointsLeft) / pointsGoal * 100);

                            spaceLine(3);
                            print(`[${target_name}] Awarding，Remaining / Total：${pointsLeft.toLocaleString()} / ${pointsGoal.toLocaleString()}`);
                            print(`Progress：${process}`);
                            spaceLine(3);

                            print('Updating Points Balances');

                            await getPoints(bot, token)
                                .then((p) => {
                                    GBots[bot].points = p;
                                    GM_setValue('bots', GBots);
                                    print(`[${botNick}] Updated，Available：${p.toLocaleString()} points`);
                                    if (p < 300) {
                                        print(`[${botNick}] not enough points，stopping`);
                                        GTask.work = false;
                                    }
                                }).catch((r) => {
                                    print(`[${botNick}] Failed to update：${r}`);
                                });

                            if (!GTask.work) {
                                break;
                            }
                        }
                    }
                }
                if (workflow.length > 0) {
                    await aiosleep(1000);
                }
            }
        } else {
            delete GBots[bot];
            GM_setValue('bots', GBots);
            print('Bots data is wrong, awarding cannot start.');
            showAlert('Error', 'Bots data is wrong, awarding cannot start.', false);
        }
        spaceLine(4);
        if (pointsLeft <= 0) {
            GTask = {};
            print('✅ Awarding Complete，Click [❌ Close] to close');
        } else {
            GTask.work = false;
            print('⛔ Awarding incomplete，Click [❌ Close] to close');
        }
        GM_setValue('task', GTask);
        appllyTask();
        showStatus('Stopped', false);
        flashHistoryList();
    }
    //====================================================================================
    //Awards
    function showAlert(title, text, succ = true) {
        ShowAlertDialog(`${succ ? '✅' : '❌'}${title}`, `<div>${text}</div>`);
    }
    //Confirmation
    function showConfirm(title, text, done = null, cancel = null) {
        ShowConfirmDialog(`⚠️${title}`, `<div>${text}</div>`, 'Confirm', 'Cancel')
            .done(() => {
                if (done) { done(); }
            })
            .fail(() => {
                if (cancel) { cancel(); }
            })
    }
    //Status
    function showStatus(text, run = true) {
        const { awardStatus, workHide } = GObjs;
        //workHide.disabled = run;
        awardStatus.textContent = `${run ? '🟩' : '🟥'} ${text}`;
    }
    //Read Config
    function loadConf() {
        const bots = GM_getValue('bots');
        GBots = isEmptyObject(bots) ? {} : bots;
        const hs = GM_getValue('history');
        GHistory = isEmptyObject(hs) ? {} : hs;
        const task = GM_getValue('task');
        GTask = isEmptyObject(task) ? {} : task;
        const panel = GM_getValue('panel');
        GPanel = isEmptyObject(panel) ? {} : panel;
    }
    //Save Config
    function saveConf() {
        GM_setValue('bots', GBots);
        GM_setValue('history', GHistory);
        GM_setValue('task', GTask);
        GM_setValue('panel', GPanel);
    }
    //Is it empty
    function isEmptyObject(obj) {
        for (const _ in obj) { return false; }
        return true;
    }
    //Loading Screen
    function loadScreen(show = true, msg = 'Loading...') {
        const { busyPanel, busyMessage } = GObjs;
        if (show) {
            busyPanel.style.opacity = '1';
            busyPanel.style.visibility = 'visible';
            if (msg) {
                busyMessage.textContent = msg;
            }
        } else {
            busyPanel.style.opacity = '0';
            busyPanel.style.visibility = 'hidden';
        }
    }
    //Log
    function workScreen(show = true) {
        const { workPanel } = GObjs;
        if (show) {
            workPanel.style.opacity = '1';
            workPanel.style.visibility = 'visible';
        } else {
            workPanel.style.opacity = '0';
            workPanel.style.visibility = 'hidden';
        }
    }
    //Progress Bar
    const BAR_STYLE = '▱▱▱▰▰▰';
    function genProgressBar(percent) {
        const full_symbol = '▰';
        const none_symbol = '▱';
        const percentStr = ` ${percent.toFixed(2)}%`
        if (percent >= 100) {
            return full_symbol.repeat(40) + percentStr;
        } else {
            percent = percent / 100;
            let full = Math.floor(percent * 40);
            let rest = percent * 40 - full;
            let middle = Math.floor(rest * 6);
            if (percent !== 0 && full === 0 && middle === 0) { middle = 1; }
            let d = Math.abs(percent - (full + middle / 6) / 40) * 100;
            if (d < Number.POSITIVE_INFINITY) {
                let m = BAR_STYLE[middle];
                if (full === 40) { m = ""; }
                return full_symbol.repeat(full) + m + BAR_STYLE[0].repeat(39 - full) + percentStr;
            }
            return none_symbol.repeat(40) + percentStr;
        }
    }
    //Log time
    function formatTime() {
        const date = new Date();
        return `${date.toLocaleDateString()} ${date.toTimeString().substr(0, 8)}`;
    }
    //output log
    function print(msg, level = 'I') {
        const { workLog } = GObjs;
        const time = formatTime();
        workLog.value += `${time} - ${level} - ${msg}\n`;
        workLog.scrollTop = workLog.scrollHeight;
        console.log(`${time} - ${level} - ${msg}`);
    }
    //draw dividing line
    function spaceLine(style = 1) {
        switch (style) {
            case 1:
                print('#'.repeat(68));
                return
            case 2:
                print('='.repeat(68));
                return
            case 3:
                print('+'.repeat(68));
                return
            case 4:
                print('~'.repeat(68));
                return
        }
    }
    //Asynchronous delay
    function asleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    //====================================================================================
    //Calculate the right awards
    function selectFitableReactions(goal, doneList) {
        const fitableList = [];
        const aviableList = [];
        for (const id of reactionIDs) {
            if (doneList.indexOf(id) === -1) {
                aviableList.push(id);
            }
        }
        aviableList.sort((a, b) => { return reactionsDict[a] - reactionsDict[b]; });
        for (const id of aviableList) {
            if (goal < 100) {
                break;
            }
            const value = reactionsDict[id] / 3;
            if (goal >= value) {
                fitableList.push(id);
                goal -= value;
            }
        }
        return fitableList;
    }
    //Get new awarrdable items
    function filterDiffReactions(newList, oldList) {
        const diffList = [];
        for (const id of newList) {
            if (oldList.indexOf(id) === -1) {
                diffList.push(id);
            }
        }
        return diffList;
    }
    //Calculate the cost of awarding project points
    function sumReactionsPoints(reactions) {
        let points = 0;
        for (const id of reactions) {
            points += reactionsDict[id];
        }
        return points / 3;
    }
    //Statistics success and failure
    function countSuccess(result) {
        let succ = 0, fail = 0;
        for (const r of result) {
            if (r) {
                succ++;
            } else {
                fail++;
            }
        }
        return ([succ, fail]);
    }
    //Asynchronous delay
    function aiosleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    //====================================================================================
    function getMySteamID() {
        return new Promise((resolve, reject) => {
            $http.getText('https://store.steampowered.com/account/?l=english')
                .then((text) => {
                    let match1 = text.match(/pageheader">([\s\S]+)'s account/);
                    let match2 = text.match(/Steam ID: (\d+)/);

                    if (match1 && match2) {
                        resolve({ nick: match1[1], steamID: match2[1] });
                    } else {
                        reject('[STEAM] Not Logged in, login and try again');
                    }
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }
    function getToken() {
        return new Promise((resolve, reject) => {
            $http.get('https://store.steampowered.com/pointssummary/ajaxgetasyncconfig')
                .then(({ data }) => {
                    if (isEmptyObject(data)) {
                        reject('[STEAM] Not Logged in, login and try again');
                    }
                    resolve(data.webapi_token);
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }
    function getPoints(steamID, token) {
        return new Promise((resolve, reject) => {
            $http.get(`https://api.steampowered.com/ILoyaltyRewardsService/GetSummary/v1/?access_token=${token}&steamid=${steamID}`)
                .then(({ response }) => {
                    if (isEmptyObject(response)) {
                        reject('[STEAM] Not Logged in, login and try again');
                    }
                    try {
                        const points = parseInt(response.summary.points);
                        if (points === points) {
                            resolve(points);
                        } else {
                            reject('Failed to load, Token or network error');
                        }
                    } catch (e) {
                        reject('Failed to load, Token or network error');
                    }
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }
    function getProfile(steamID) {
        return new Promise((resolve, reject) => {
            $http.getText(`https://steamcommunity.com/profiles/${steamID}/?xml=1`)
                .then((text) => {
                    try {
                        const match = text.match(/<steamID><!\[CDATA\[([\s\S]*)\]\]><\/steamID>/) ||
                            text.match(/<steamID>([\s\S]*)<\/steamID>/);
                        if (match) {
                            resolve([true, match[1].substring()]);
                        } else {
                            resolve([false, null]);
                        }
                    } catch (e) {
                        reject(e);
                    }
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }
    function getAwardCounts(steamID, type) {
        let subPath, preg;
        switch (type) {
            case 'r':
                subPath = 'recommended/?l=english';
                preg = /Total (\d+) Reviews/;
                break;
            case 's':
                subPath = 'screenshots/?l=english';
                preg = /Total (\d+) Screenshots/;
                break;
            case 'i':
                subPath = 'images/?l=english';
                preg = /Total (\d+) artworks/;
                break;
            default:
                throw 'type error';
        }
        return new Promise((resolve, reject) => {
            $http.getText(`https://steamcommunity.com/profiles/${steamID}/${subPath}`)
                .then((text) => {
                    try {
                        const match = text.match(preg);
                        const count = match ? Number(match[1]) : 0;
                        resolve([type, true, count]);
                    } catch (e) {
                        resolve([type, false, 0]);
                    }
                })
                .catch((reason) => {
                    console.error(reason);
                    resolve([type, false, 0]);
                });
        });
    }
    function getAwardItems(steamID, type, p = 1) {
        let subPath, preg;
        switch (type) {
            case 'r':
                subPath = `recommended/?p=${p}&l=english`;
                preg = /id="RecommendationVoteUpBtn(\d+)"/g;
                break;
            case 's':
                subPath = `screenshots/?p=${p}&view=grid&l=english`;
                preg = /id="imgWallHover(\d+)"/g;
                break;
            case 'i':
                subPath = `images/?p=${p}&view=grid&l=english`;
                preg = /id="imgWallHover(\d+)"/g;
                break;
            default:
                throw 'type error';
        }
        return new Promise((resolve, reject) => {
            $http.getText(`https://steamcommunity.com/profiles/${steamID}/${subPath}`)
                .then((text) => {
                    try {
                        const result = [];
                        const matches = text.matchAll(preg);
                        for (const match of matches) {
                            result.push(match[1]);
                        }
                        resolve([true, result]);
                    } catch (e) {
                        console.error(e);
                        resolve([false, e]);
                    }
                })
                .catch((reason) => {
                    console.error(reason);
                    resolve([false, reason]);
                });
        });
    }
    function getAwardRecords(token, targetType, targetID) {
        return new Promise((resolve, reject) => {
            const params = `access_token=${token}&target_type=${targetType}&targetid=${targetID}`;
            $http.get('https://api.steampowered.com/ILoyaltyRewardsService/GetReactions/v1/?' + params)
                .then(({ response }) => {
                    const { reactionids } = response;
                    resolve([true, reactionids || []]);
                })
                .catch((reason) => {
                    console.error(reason);
                    resolve([false, null]);
                });
        });
    }
    function sendAwardReaction(token, targetType, targetID, reactionID) {
        return new Promise((resolve, reject) => {
            const params = `access_token=${token}&target_type=${targetType}&targetid=${targetID}&reactionid=${reactionID}`;
            $http.post('https://api.steampowered.com/ILoyaltyRewardsService/AddReaction/v1/?' + params)
                .then((json) => {
                    console.log(json);
                    resolve(true);
                })
                .catch((reason) => {
                    console.error(reason);
                    resolve(false);
                });
        });
    }
})();
//====================================================================================
class Request {
    constructor(timeout = 3000) {
        this.timeout = timeout;
    }
    get(url, opt = {}) {
        return this.baseRequest(url, 'GET', opt, 'json');
    }
    getHtml(url, opt = {}) {
        return this.baseRequest(url, 'GET', opt, '');
    }
    getText(url, opt = {}) {
        return this.baseRequest(url, 'GET', opt, 'text');
    }
    post(url, data, opt = {}) {
        opt.data = JSON.stringify(data);
        return this.baseRequest(url, 'POST', opt, 'json');
    }
    baseRequest(url, method = 'GET', opt = {}, responseType = 'json') {
        Object.assign(opt, {
            url, method, responseType, timeout: this.timeout
        });
        return new Promise((resolve, reject) => {
            opt.ontimeout = opt.onerror = reject;
            opt.onload = ({ readyState, status, response, responseText }) => {
                if (readyState === 4 && status === 200) {
                    if (responseType == 'json') {
                        resolve(response);
                    } else if (responseType == 'text') {
                        resolve(responseText);
                    }
                } else {
                    console.error('Network Error');
                    console.log(readyState);
                    console.log(status);
                    console.log(response);
                    reject('Parse error');
                }
            }
            GM_xmlhttpRequest(opt);
        });
    }
}

const $http = new Request();

//CSS
GM_addStyle(`
.aam_panel,
.aam_work {
  padding: 16px;
  display: flex;
  background: var(--gradient-background);
  background-size:  calc(100vw + 6px) !important;
  margin-left: -12px;
  margin-right: -12px;
}

.aam_panel {
    position: relative;
    background-position: top left;
    background-repeat: no-repeat;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    border-radius: 3px;
    padding: 0px 0px 0px 0px;
    font-size: 13px;
    overflow: hidden;
}

.holidayprofile .headeroverried {
color: #e4ca63 !important;
}

.holidayprofile .aam_panel {
	background: url( 'https://community.akamai.steamstatic.com/public/images/profile/holidayprofile/showcase_repeat.png' ) repeat-y !important;
    margin-left: -12px;
	z-index: 2;
	max-width: 1057px;
}

.holidayprofile_header_overlay {
	position: absolute;
	z-index: 2;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;

	background: url( 'https://community.akamai.steamstatic.com/public/images/profile/holidayprofile/header_front.png' ) no-repeat center top;
	pointer-events: none;
}
@media only screen and (max-width: 909px) {
  .headeroverried {
    min-width: 40em !important;
  }
  .profile_leftcol {
  padding-top: 5em
  }
}

@media only screen and (min-width: 910px) {
  .headeroverried {
    min-width: 30vw !important;
  }
}

.headeroverried {
    font-weight: 200 !important;
    line-height: normal !important;
    background: linear-gradient(90deg, var(--gradient-showcase-header-left) 0vw, var(--color-showcase-header) 63vw) !important;
    color: #ffffff !important;
    font-size: 16px !important;
    white-space: normal !important;
    text-overflow: ellipsis !important;
    box-sizing: border-box !important;
    background-size:  55em 6vh !important;
    background-repeat: no-repeat !important;
    display: block;
    margin-bottom: 0px !important;
}
.aam_work {
  z-index: 500 !important;
}
.aam_busy {
  width: 100vw;
  height: calc(26vh);
  z-index: 700;
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.7);
  display: table;
  visibility: hidden;
  opacity: 0;
  transition: all 0.1s;
  background-size:  calc(100vw + 6px) !important;
  margin-left: -12px;
  margin-right: -12px;
}
.aam_busy_content {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
}
.aam_left {
  width: 61vw;
  padding-right: 10px;
}
.aam_award {
  width: 39vw;
  margin-right: 28px;
}
.aam_list,
.aam_select,
.aam_input,
.aam_textarea {
  background-color: #fff !important;
  color: #000 !important;
  border: none !important;
  border-radius: 0 !important;
}
.aam_input {
  width: 98% !important;
  text-align: center;
}
.aam_list {
  height: 230px;
  resize: vertical;
  overflow: auto;
  z-index:999999999;
}
.aam_textarea {
  height: calc(100% - 85px);
  width: calc(100% - 45px);
  resize: none;
  font-size: 11px;
}
.aam_left > div > *,
.aam_award:not(span, button) > * {
  width: 95%;
  margin-bottom: 5px;
  margin-left: 12px
}
.aam_btns > button:not(:last-child) {
  margin-right: 4px;
}
.aam_award_btns {
  z-index: 600;
  bottom: 10px;
  margin-top: -20px;
}
.aam_work > * {
  position: absolute;
}
.aam_work > span {
  bottom: 12%;
  left: 70px;
}
.aam_work > button {
  bottom: 11%;
}
.aam_a {
  margin-left: 110px;
}`);
