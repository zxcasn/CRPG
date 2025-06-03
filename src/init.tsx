import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Heart, Zap, Shield, Star, Sparkles, TrendingUp, Map, Settings } from 'lucide-react';

// カードのレア度定義
const RARITY = { EX: 4, SSR: 3, SR: 2, R: 1 };
const RARITY_NAMES = ['', 'R', 'SR', 'SSR', 'EX'];
const RARITY_COLORS = ['', 'bg-gray-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500'];

// 属性定義
const ELEMENTS = {
  fire: { name: '火', color: 'bg-red-500', icon: '🔥' },
  water: { name: '水', color: 'bg-blue-500', icon: '💧' },
  wind: { name: '風', color: 'bg-green-500', icon: '🌪️' },
  earth: { name: '土', color: 'bg-yellow-700', icon: '⛰️' },
  light: { name: '光', color: 'bg-yellow-300', icon: '✨' },
  dark: { name: '闇', color: 'bg-purple-800', icon: '🌑' }
};

// カードデータ生成
const generateCard = (id) => {
  const elements = Object.keys(ELEMENTS);
  const element = elements[Math.floor(Math.random() * elements.length)];
  const rarity = Math.floor(Math.random() * 4) + 1;
  const baseAtk = rarity * 3 + Math.floor(Math.random() * 5);
  const baseDef = rarity * 2 + Math.floor(Math.random() * 4);
  
  return {
    id,
    name: `カード${id}`,
    element,
    rarity,
    atk: baseAtk,
    def: baseDef,
    level: 1,
    star: 1,
    skill: {
      name: 'スキル',
      type: Math.random() > 0.5 ? 'active' : 'passive',
      cost: Math.floor(Math.random() * 3) + 2,
      description: '追加効果'
    }
  };
};

// 初期デッキ生成
const generateInitialDeck = () => {
  const deck = [];
  for (let i = 1; i <= 30; i++) {
    deck.push(generateCard(i));
  }
  return deck;
};

const CardDeckRPG = () => {
  const [gameState, setGameState] = useState('menu');
  const [playerDeck, setPlayerDeck] = useState(generateInitialDeck());
  const [playerHP, setPlayerHP] = useState(50);
  const [enemyHP, setEnemyHP] = useState(50);
  const [playerEnergy, setPlayerEnergy] = useState(10);
  const [turn, setTurn] = useState(1);
  const [hand, setHand] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [enemyCard, setEnemyCard] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [fieldCards, setFieldCards] = useState([]);
  const [elementSynergy, setElementSynergy] = useState(null);

  // ゲーム画面サイズ設定（iOS向け）
  const gameContainerStyle = {
    width: '100%',
    maxWidth: '430px',
    height: '100vh',
    maxHeight: '932px',
    margin: '0 auto',
    backgroundColor: '#1a1a2e',
    position: 'relative',
    overflow: 'hidden'
  };

  // カードを引く
  const drawCards = useCallback(() => {
    const newHand = [];
    const availableCards = [...playerDeck];
    for (let i = 0; i < 5 && availableCards.length > 0; i++) {
      const index = Math.floor(Math.random() * availableCards.length);
      newHand.push(availableCards[index]);
      availableCards.splice(index, 1);
    }
    setHand(newHand);
  }, [playerDeck]);

  // バトル開始
  const startBattle = () => {
    setGameState('battle');
    setPlayerHP(50);
    setEnemyHP(50);
    setPlayerEnergy(10);
    setTurn(1);
    setBattleLog([]);
    setFieldCards([]);
    drawCards();
  };

  // カード選択
  const selectCard = (card) => {
    if (card.skill.cost <= playerEnergy) {
      setSelectedCard(card);
    }
  };

  // ターン実行
  const executeTurn = () => {
    if (!selectedCard) return;

    // エネルギー消費
    setPlayerEnergy(prev => prev - selectedCard.skill.cost);

    // 敵のカード選択（ランダム）
    const enemyDeck = generateInitialDeck();
    const enemySelectedCard = enemyDeck[Math.floor(Math.random() * enemyDeck.length)];
    setEnemyCard(enemySelectedCard);

    // フィールドにカード追加
    const newFieldCards = [...fieldCards, selectedCard];
    if (newFieldCards.length > 3) {
      newFieldCards.shift();
    }
    setFieldCards(newFieldCards);

    // 属性シナジーチェック
    checkElementSynergy(newFieldCards);

    // ダメージ計算
    const playerDamage = Math.max(0, selectedCard.atk - enemySelectedCard.def);
    const enemyDamage = Math.max(0, enemySelectedCard.atk - selectedCard.def);

    // シナジーボーナス
    let synergyBonus = 0;
    if (elementSynergy) {
      synergyBonus = 5;
    }

    // HP更新
    setEnemyHP(prev => Math.max(0, prev - (playerDamage + synergyBonus)));
    setPlayerHP(prev => Math.max(0, prev - enemyDamage));

    // バトルログ更新
    setBattleLog(prev => [
      `ターン${turn}: ${selectedCard.name} vs ${enemySelectedCard.name}`,
      `プレイヤー攻撃: ${playerDamage + synergyBonus}ダメージ${synergyBonus > 0 ? ' (シナジー!)' : ''}`,
      `敵攻撃: ${enemyDamage}ダメージ`,
      ...prev
    ].slice(0, 5));

    // ターン終了処理
    setTurn(prev => prev + 1);
    setPlayerEnergy(prev => Math.min(20, prev + 5));
    setSelectedCard(null);
    drawCards();
  };

  // 属性シナジーチェック
  const checkElementSynergy = (cards) => {
    if (cards.length < 3) {
      setElementSynergy(null);
      return;
    }

    const elementCount = {};
    cards.forEach(card => {
      elementCount[card.element] = (elementCount[card.element] || 0) + 1;
    });

    for (const [element, count] of Object.entries(elementCount)) {
      if (count >= 3) {
        setElementSynergy(element);
        return;
      }
    }
    setElementSynergy(null);
  };

  // 勝敗判定
  useEffect(() => {
    if (gameState === 'battle') {
      if (playerHP <= 0) {
        setGameState('gameover');
      } else if (enemyHP <= 0) {
        setGameState('victory');
      }
    }
  }, [playerHP, enemyHP, gameState]);

  // カードコンポーネント
  const Card = ({ card, onClick, disabled = false, small = false }) => {
    const size = small ? 'w-20 h-28' : 'w-24 h-32';
    const fontSize = small ? 'text-xs' : 'text-sm';
    
    return (
      <div
        onClick={() => !disabled && onClick && onClick(card)}
        className={`${size} rounded-lg border-2 border-gray-600 p-2 flex flex-col items-center justify-between cursor-pointer transition-all ${
          disabled ? 'opacity-50' : 'hover:scale-105 hover:border-white'
        } ${selectedCard?.id === card.id ? 'border-yellow-400 scale-105' : ''}`}
        style={{ background: 'linear-gradient(135deg, #2a2a3e 0%, #16161e 100%)' }}
      >
        <div className={`w-full text-center ${fontSize} font-bold text-white`}>
          {RARITY_NAMES[card.rarity]}
        </div>
        <div className="text-2xl">{ELEMENTS[card.element].icon}</div>
        <div className={`${fontSize} text-white`}>{card.name}</div>
        <div className="flex justify-between w-full mt-1">
          <div className={`${fontSize} text-red-400 flex items-center`}>
            <Shield className="w-3 h-3 mr-1" />
            {card.atk}
          </div>
          <div className={`${fontSize} text-blue-400 flex items-center`}>
            <Heart className="w-3 h-3 mr-1" />
            {card.def}
          </div>
        </div>
        <div className={`${fontSize} text-yellow-300 flex items-center`}>
          <Zap className="w-3 h-3" />
          {card.skill.cost}
        </div>
      </div>
    );
  };

  // メニュー画面
  if (gameState === 'menu') {
    return (
      <div style={gameContainerStyle} className="flex flex-col items-center justify-center p-8 text-white">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Card Deck RPG
        </h1>
        <p className="text-gray-400 mb-8">カードバトルの世界へようこそ</p>
        
        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={startBattle}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:scale-105 transition-all flex items-center justify-center"
          >
            <Sparkles className="mr-2" />
            バトル開始
          </button>
          
          <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-bold text-lg hover:scale-105 transition-all flex items-center justify-center">
            <Map className="mr-2" />
            冒険モード
          </button>
          
          <button className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-lg hover:scale-105 transition-all flex items-center justify-center">
            <TrendingUp className="mr-2" />
            ランキング
          </button>
          
          <button className="w-full py-4 bg-gray-700 rounded-lg font-bold text-lg hover:scale-105 transition-all flex items-center justify-center">
            <Settings className="mr-2" />
            設定
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          Ver 1.0.0 | © 2025 Card Deck RPG
        </div>
      </div>
    );
  }

  // バトル画面
  if (gameState === 'battle') {
    return (
      <div style={gameContainerStyle} className="flex flex-col text-white">
        {/* ヘッダー */}
        <div className="bg-gradient-to-b from-purple-900 to-transparent p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-lg font-bold">ターン {turn}</div>
            <div className="flex items-center">
              <Zap className="text-yellow-400 mr-1" />
              <span className="font-bold">{playerEnergy}/20</span>
            </div>
          </div>
        </div>

        {/* 敵エリア */}
        <div className="flex-1 p-4">
          <div className="bg-red-900/20 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">敵</span>
              <div className="flex items-center">
                <Heart className="text-red-500 mr-1" />
                <span className="font-bold">{enemyHP}/50</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all"
                style={{ width: `${(enemyHP / 50) * 100}%` }}
              />
            </div>
            {enemyCard && (
              <div className="mt-4 flex justify-center">
                <Card card={enemyCard} small disabled />
              </div>
            )}
          </div>

          {/* フィールド */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-400 mb-2">フィールド</div>
            <div className="flex justify-center space-x-2">
              {fieldCards.map((card, index) => (
                <Card key={index} card={card} small disabled />
              ))}
            </div>
            {elementSynergy && (
              <div className="mt-2 text-center text-yellow-400 font-bold">
                {ELEMENTS[elementSynergy].icon} {ELEMENTS[elementSynergy].name}属性シナジー発動中！
              </div>
            )}
          </div>

          {/* プレイヤーエリア */}
          <div className="bg-blue-900/20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">プレイヤー</span>
              <div className="flex items-center">
                <Heart className="text-green-500 mr-1" />
                <span className="font-bold">{playerHP}/50</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${(playerHP / 50) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 手札エリア */}
        <div className="bg-gradient-to-t from-gray-900 to-transparent p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold">手札</span>
            <button
              onClick={executeTurn}
              disabled={!selectedCard}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                selectedCard
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-gray-600 opacity-50 cursor-not-allowed'
              }`}
            >
              ターン実行
            </button>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {hand.map((card, index) => (
              <Card
                key={index}
                card={card}
                onClick={selectCard}
                disabled={card.skill.cost > playerEnergy}
              />
            ))}
          </div>
        </div>

        {/* バトルログ */}
        <div className="absolute bottom-24 right-4 bg-black/70 rounded-lg p-2 max-w-xs">
          <div className="text-xs space-y-1">
            {battleLog.map((log, index) => (
              <div key={index} className={`${index === 0 ? 'text-yellow-300' : 'text-gray-400'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 勝利画面
  if (gameState === 'victory') {
    return (
      <div style={gameContainerStyle} className="flex flex-col items-center justify-center p-8 text-white">
        <h2 className="text-4xl font-bold mb-4 text-yellow-400">Victory!</h2>
        <p className="text-xl mb-8">バトルに勝利しました！</p>
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">報酬</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <Star className="text-yellow-400 mr-2" />
              <span>経験値 +100</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="text-purple-400 mr-2" />
              <span>コイン +50</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setGameState('menu')}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:scale-105 transition-all"
        >
          メニューに戻る
        </button>
      </div>
    );
  }

  // ゲームオーバー画面
  if (gameState === 'gameover') {
    return (
      <div style={gameContainerStyle} className="flex flex-col items-center justify-center p-8 text-white">
        <h2 className="text-4xl font-bold mb-4 text-red-500">Game Over</h2>
        <p className="text-xl mb-8">バトルに敗北しました...</p>
        <button
          onClick={() => setGameState('menu')}
          className="px-8 py-3 bg-gray-700 rounded-lg font-bold hover:scale-105 transition-all"
        >
          メニューに戻る
        </button>
      </div>
    );
  }

  return null;
};

export default CardDeckRPG;