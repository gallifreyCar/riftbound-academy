const missions = [
  {
    tag: "任务 01",
    title: "选你的冠军",
    copy:
      "你的传奇冠军决定整套牌的颜色和打法。先别急着背全部规则，先回答一个问题：你想快攻、铺场，还是靠一个关键角色到处支援？",
    cards: ["Champion", "Unit", "Spell"],
  },
  {
    tag: "任务 02",
    title: "用符文付款",
    copy:
      "符文来自独立的符文牌堆。每回合拿到两张新符文，普通费用可以横置支付，更重的费用可能要把符文放回牌堆。",
    cards: ["Rune +1", "Rune +1", "Pay Cost"],
  },
  {
    tag: "任务 03",
    title: "派单位上战场",
    copy:
      "1v1 构筑对局有 2 张战场卡，它们都在战场区域里。战场的提供者不等于控制者；你可以控制对手提供的战场，对手也可以夺回你控制的战场。",
    cards: ["Field A", "Field B", "Control"],
  },
  {
    tag: "任务 04",
    title: "抢到 8 分",
    copy:
      "得分主要来自两种方式：通过争夺建立战场控制叫 Conquer；开始阶段继续控制战场叫 Hold。1v1 通常先到 8 分获胜。",
    cards: ["Conquer", "Hold", "Win"],
  },
];

const missionButtons = document.querySelectorAll(".mission");
const missionTag = document.querySelector("#mission-tag");
const missionTitle = document.querySelector("#mission-title");
const missionCopy = document.querySelector("#mission-copy");
const missionBoard = document.querySelector("#mission-board");

function renderMission(index) {
  const mission = missions[index];
  missionTag.textContent = mission.tag;
  missionTitle.textContent = mission.title;
  missionCopy.textContent = mission.copy;
  missionBoard.innerHTML = mission.cards
    .map((card, cardIndex) => {
      const styles = ["champion", "unit", "spell"];
      return `<div class="demo-card ${styles[cardIndex]}">${card}</div>`;
    })
    .join("");

  missionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mission === String(index));
  });
}

missionButtons.forEach((button) => {
  button.addEventListener("click", () => renderMission(Number(button.dataset.mission)));
});

document.querySelectorAll(".answers button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".answers button").forEach((item) => {
      item.classList.remove("selected");
    });
    button.classList.add("selected");
    const feedback = document.querySelector("#feedback");
    const isCorrect = button.dataset.correct === "true";
    feedback.textContent = isCorrect
      ? "正确。先到 8 分就是 1v1 的核心目标。"
      : "再想想：团队战是 11 分，1v1 的目标更低。";
  });
});

const initialPractice = {
  step: 0,
  phase: "准备",
  score: 0,
  runes: 0,
  bench: "等待发牌",
  playerMainDeck: 40,
  playerRuneDeck: 12,
  playerRuneBank: 0,
  playerDiscard: 0,
  playerBanish: 0,
  opponentMainDeck: 40,
  opponentRuneDeck: 12,
  opponentRuneBank: 0,
  opponentDiscard: 0,
  opponentBanish: 0,
  opponentHand: 0,
  enemyVisible: false,
  sites: {
    arena: { text: "无单位", state: "", status: "开放 · 未受控制" },
    bridge: { text: "无单位", state: "", status: "开放 · 未受控制" },
  },
  hand: [],
  log: [],
  coach: "点击“开始对局”，先看桌面区域：传奇区是英雄的“头”，英雄区是选定英雄这张同名单位牌，符文牌堆是独立 12 张。",
  primary: "开始对局",
};

const practiceCards = [
  {
    id: "scout",
    name: "皮城侦察兵",
    cost: 1,
    text: "2 力单位。适合进入开放战场建立控制。",
  },
  {
    id: "trick",
    name: "精准指令",
    cost: 1,
    text: "练习牌：本局先别打，保留给下回合。",
  },
];

let practice = structuredClone(initialPractice);
let practiceHistory = [];

const practicePhase = document.querySelector("#practice-phase");
const practiceScore = document.querySelector("#practice-score");
const practiceRunes = document.querySelector("#practice-runes");
const coachCopy = document.querySelector("#coach-copy");
const practicePrimary = document.querySelector("#practice-primary");
const practiceUndo = document.querySelector("#practice-undo");
const practiceReset = document.querySelector("#practice-reset");
const practiceHand = document.querySelector("#practice-hand");
const practiceLog = document.querySelector("#practice-log");
const playerBench = document.querySelector("#player-bench");
const enemyCard = document.querySelector("#enemy-card");
const zoneCounters = {
  playerMainDeck: document.querySelector("#player-main-deck"),
  playerRuneDeck: document.querySelector("#player-rune-deck"),
  playerDiscard: document.querySelector("#player-discard"),
  playerBanish: document.querySelector("#player-banish"),
  playerHandCount: document.querySelector("#player-hand-count"),
  playerRuneBank: document.querySelector("#player-rune-bank"),
  opponentMainDeck: document.querySelector("#opponent-main-deck"),
  opponentRuneDeck: document.querySelector("#opponent-rune-deck"),
  opponentDiscard: document.querySelector("#opponent-discard"),
  opponentBanish: document.querySelector("#opponent-banish"),
  opponentHandCount: document.querySelector("#opponent-hand-count"),
  opponentRuneBank: document.querySelector("#opponent-rune-bank"),
};
const siteEls = {
  arena: {
    slot: document.querySelector("#site-arena"),
    status: document.querySelector("#state-arena"),
  },
  bridge: {
    slot: document.querySelector("#site-bridge"),
    status: document.querySelector("#state-bridge"),
  },
};

function savePractice() {
  practiceHistory.push(structuredClone(practice));
  practiceUndo.disabled = false;
}

function addPracticeLog(text) {
  practice.log.unshift(text);
}

function renderPractice() {
  practicePhase.textContent = practice.phase;
  practiceScore.textContent = `${practice.score} / 8`;
  practiceRunes.textContent = practice.runes;
  coachCopy.textContent = practice.coach;
  practicePrimary.textContent = practice.primary;
  practiceUndo.disabled = practiceHistory.length === 0;

  playerBench.textContent = practice.bench;
  playerBench.classList.toggle("ready", practice.bench !== "等待发牌" && practice.bench !== "空");
  enemyCard.classList.toggle("hidden", !practice.enemyVisible);
  zoneCounters.playerMainDeck.textContent = `主牌堆 ${practice.playerMainDeck}`;
  zoneCounters.playerRuneDeck.textContent = `符文牌堆 ${practice.playerRuneDeck}`;
  zoneCounters.playerDiscard.textContent = `废牌堆 ${practice.playerDiscard}`;
  zoneCounters.playerBanish.textContent = `放逐区 ${practice.playerBanish}`;
  zoneCounters.playerHandCount.textContent = `手牌 ${practice.hand.length}`;
  zoneCounters.playerRuneBank.textContent = `已召出符文 ${practice.playerRuneBank}`;
  zoneCounters.opponentMainDeck.textContent = `主牌堆 ${practice.opponentMainDeck}`;
  zoneCounters.opponentRuneDeck.textContent = `符文牌堆 ${practice.opponentRuneDeck}`;
  zoneCounters.opponentDiscard.textContent = `废牌堆 ${practice.opponentDiscard}`;
  zoneCounters.opponentBanish.textContent = `放逐区 ${practice.opponentBanish}`;
  zoneCounters.opponentHandCount.textContent = `手牌 ${practice.opponentHand}`;
  zoneCounters.opponentRuneBank.textContent = `已召出符文 ${practice.opponentRuneBank}`;

  Object.entries(siteEls).forEach(([site, element]) => {
    element.slot.textContent = practice.sites[site].text;
    element.slot.className = `site-slot ${practice.sites[site].state}`;
    element.status.textContent = practice.sites[site].status;
  });

  practiceHand.innerHTML = practice.hand
    .map(
      (card) => `
        <button class="hand-card" data-card="${card.id}" ${practice.step !== 3 ? "disabled" : ""}>
          ${card.name}
          <span>费用 ${card.cost} · ${card.text}</span>
        </button>
      `,
    )
    .join("");

  practiceLog.innerHTML = practice.log.map((item) => `<li>${item}</li>`).join("");
}

function advancePractice() {
  savePractice();

  if (practice.step === 0) {
    practice.step = 1;
    practice.phase = "开局";
    practice.playerMainDeck = 38;
    practice.opponentMainDeck = 36;
    practice.opponentHand = 4;
    practice.hand = structuredClone(practiceCards);
    practice.primary = "进入召出阶段";
    practice.coach = "开局双方各抽 4 张并调度；这里给你保留 2 张可操作手牌。传奇区的金克丝是“头”，英雄区的金克丝单位牌是可打出的“身子”。";
    addPracticeLog("开局：传奇进传奇区，选定英雄进英雄区；双方抽牌并调度。");
  } else if (practice.step === 1) {
    practice.step = 2;
    practice.phase = "资源";
    practice.runes = 2;
    practice.playerRuneDeck = 10;
    practice.playerRuneBank = 2;
    practice.primary = "确认拿符文";
    practice.coach = "召出阶段从符文牌堆召出 2 张符文。下一步打出 1 费单位，系统会自动支付。";
    addPracticeLog("召出：从 12 张符文牌堆召出 2 张，符文牌堆剩 10。");
  } else if (practice.step === 2) {
    practice.step = 3;
    practice.phase = "部署";
    practice.primary = "等待出牌";
    practice.coach = "点击手牌里的“皮城侦察兵”。先别打指令牌，练习目标是让单位进入一处开放战场。";
    addPracticeLog("资源确认：这回合可以支付 2 点费用。");
  } else if (practice.step === 4) {
    practice.step = 5;
    practice.phase = "行动";
    practice.primary = "移动到战场 B";
    practice.coach = "单位已经在你的基地。现在把它移动到战场 B。战场 B 由对手提供，但当前开放且未受控制。";
    addPracticeLog("部署完成：皮城侦察兵进入你的基地。");
  } else if (practice.step === 5) {
    practice.step = 6;
    practice.phase = "法术对决";
    practice.primary = "确立控制";
    practice.bench = "空";
    practice.sites.bridge = {
      text: "你的皮城侦察兵 2 力",
      state: "controlled",
      status: "被占领 · 争夺待结算",
    };
    practice.coach = "移动到开放战场会让该战场进入争夺，并开启非战斗法术对决。无人防守时，对决后你会建立控制。";
    addPracticeLog("移动：皮城侦察兵进入战场 B。该战场进入争夺，开启非战斗法术对决。");
  } else if (practice.step === 6) {
    practice.step = 7;
    practice.phase = "征服";
    practice.primary = "结算得分";
    practice.sites.bridge = {
      text: "你的皮城侦察兵 2 力",
      state: "controlled",
      status: "被占领 · 控制者：你",
    };
    practice.coach = "法术对决结束后，你在战场 B 有单位，因此建立控制。因为本回合尚未通过此战场得分，这会导致一次征服。";
    addPracticeLog("控制：你建立对战场 B 的控制。提供者仍是对手，但控制者现在是你。");
  } else if (practice.step === 7) {
    practice.step = 8;
    practice.phase = "得分";
    practice.primary = "进入下回合";
    practice.score = 1;
    practice.coach = "征服会让你获得最多 1 分，并触发该战场上的征服技能。下一回合如果仍控制此战场，就能据守得分。";
    addPracticeLog("征服：通过战场 B 得 1 分。");
  } else if (practice.step === 8) {
    practice.step = 9;
    practice.phase = "开始阶段";
    practice.primary = "对手行动";
    practice.score = 2;
    practice.coach = "你的开始阶段得分计算步骤中，你仍控制战场 B，因此通过据守得 1 分。";
    addPracticeLog("据守：开始阶段仍控制战场 B，得 1 分。");
  } else if (practice.step === 9) {
    practice.step = 10;
    practice.phase = "对手";
    practice.primary = "开始战斗";
    practice.enemyVisible = false;
    practice.opponentRuneDeck = 10;
    practice.opponentRuneBank = 2;
    practice.sites.bridge = {
      text: "你的侦察兵防守 / 敌方单位进攻",
      state: "contested",
      status: "被占领 · 正在争夺",
    };
    practice.coach = "对手让单位进入你控制的战场 B。因为同一战场出现敌对单位，战场进入争夺并标记待发生战斗。";
    addPracticeLog("对手行动：敌方单位进入战场 B。该战场进入争夺，并待发生战斗。");
  } else if (practice.step === 10) {
    practice.step = 11;
    practice.phase = "战斗";
    practice.primary = "分配伤害";
    practice.coach = "战斗先进入战斗法术对决：令战场进入争夺的对手是进攻方，你是防守方。";
    addPracticeLog("战斗法术对决：确定进攻方与防守方。");
  } else if (practice.step === 11) {
    practice.step = 12;
    practice.phase = "伤害";
    practice.primary = "判定结果";
    practice.coach = "双方各有 2 点战力，互相分配 2 点战斗伤害，然后同时造成。";
    addPracticeLog("战斗伤害：双方各分配并造成 2 点伤害。");
  } else if (practice.step === 12) {
    practice.step = 13;
    practice.phase = "结算";
    practice.primary = "完成练习";
    practice.sites.bridge = {
      text: "无单位",
      state: "",
      status: "开放 · 未受控制",
    };
    practice.playerDiscard = 1;
    practice.opponentDiscard = 1;
    practice.coach = "双方单位都受到致命伤害，没有单位存活，所以战斗无结果，战场变为未受控制。";
    addPracticeLog("战斗结果：双方都没有单位存活，战斗无结果，战场未受控制。");
  } else {
    practice.phase = "完成";
    practice.primary = "再打一把";
    practice.coach = "你已经跑完资源、部署、移动、征服、据守和一次简化战斗。现在可以重开再熟一遍。";
    addPracticeLog("练习完成：对局核心骨架已经跑通。");
    practice.step = 0;
  }

  renderPractice();
}

function playPracticeCard(cardId) {
  if (practice.step !== 3) {
    return;
  }

  if (cardId !== "scout") {
    practice.coach = "这张牌先留着。现在要练的是打出单位并进入开放战场。";
    renderPractice();
    return;
  }

  savePractice();
  practice.step = 4;
  practice.runes -= 1;
  practice.playerRuneBank = 1;
  practice.hand = practice.hand.filter((card) => card.id !== cardId);
  practice.bench = "皮城侦察兵 2 力";
  practice.primary = "完成部署";
  practice.coach = "自动支付 1 个符文，单位进入你的基地。下一步点击“完成部署”。";
  addPracticeLog("自动支付：横置 1 个符文，打出皮城侦察兵。");
  renderPractice();
}

practicePrimary.addEventListener("click", () => {
  if (practice.step === 3) {
    practice.coach = "先从手牌打出“皮城侦察兵”，再继续。";
    renderPractice();
    return;
  }
  advancePractice();
});

practiceHand.addEventListener("click", (event) => {
  const cardButton = event.target.closest("[data-card]");
  if (!cardButton) {
    return;
  }
  playPracticeCard(cardButton.dataset.card);
});

practiceUndo.addEventListener("click", () => {
  const previous = practiceHistory.pop();
  if (!previous) {
    return;
  }
  practice = previous;
  renderPractice();
});

practiceReset.addEventListener("click", () => {
  practice = structuredClone(initialPractice);
  practiceHistory = [];
  renderPractice();
});

renderPractice();
