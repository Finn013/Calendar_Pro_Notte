import React, { useState, useEffect } from 'react';

interface LockScreenProps {
  theme: string;
  onUnlock: () => void;
}

const PIN_KEY = 'app_pin';

const LockScreen: React.FC<LockScreenProps> = ({ theme, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'enter' | 'set' | 'confirm' | 'change' | 'old' | 'new' | 'confirmNew'>('enter');
  const [input, setInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem(PIN_KEY);
    if (savedPin) {
      setPin(savedPin);
      setStep('enter');
    } else {
      setStep('set');
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value.replace(/\D/g, ''));
    setError('');
  };

  const handleShowPin = () => setShowPin((v) => !v);

  const handleEnter = () => {
    if (input === pin) {
      setError('');
      setInput('');
      onUnlock();
    } else {
      setError('Неверный PIN');
    }
  };

  const handleSet = () => {
    if (input.length < 4) {
      setError('Минимум 4 цифры');
      return;
    }
    setNewPin(input);
    setInput('');
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (input === newPin) {
      localStorage.setItem(PIN_KEY, newPin);
      setPin(newPin);
      setInput('');
      setNewPin('');
      setStep('enter');
      setError('PIN установлен!');
    } else {
      setError('PIN не совпадает');
    }
  };

  const handleChange = () => {
    setStep('old');
    setInput('');
    setError('');
  };

  const handleOld = () => {
    if (input === pin) {
      setStep('new');
      setInput('');
      setError('');
    } else {
      setError('Неверный текущий PIN');
    }
  };

  const handleNew = () => {
    if (input.length < 4) {
      setError('Минимум 4 цифры');
      return;
    }
    setNewPin(input);
    setInput('');
    setStep('confirmNew');
  };

  const handleConfirmNew = () => {
    if (input === newPin) {
      localStorage.setItem(PIN_KEY, newPin);
      setPin(newPin);
      setInput('');
      setNewPin('');
      setStep('enter');
      setError('PIN изменён!');
    } else {
      setError('PIN не совпадает');
    }
  };

  const handleReset = () => {
    localStorage.removeItem(PIN_KEY);
    setPin('');
    setStep('set');
    setError('PIN сброшен!');
  };

  // Стилизация под тему
  const bg = theme === 'dark' ? 'bg-gray-900 text-orange-200' : 'bg-orange-50 text-gray-800';
  const inputStyle = theme === 'dark' ? 'bg-gray-800 text-orange-200 border-orange-400' : 'bg-white text-gray-800 border-orange-400';
  const btnStyle = theme === 'dark' ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${bg}`}
         style={{ minHeight: '100vh' }}>
      <div className="w-full max-w-xs p-6 rounded-xl shadow-xl border border-orange-300 flex flex-col gap-4 items-center">
        <div className="text-2xl font-bold mb-2">Блокировка</div>
        {step === 'enter' && (
          <>
            <div>Введите PIN для доступа</div>
            <input
              type={showPin ? 'text' : 'password'}
              className={`w-full p-2 rounded border ${inputStyle}`}
              value={input}
              onChange={handleInput}
              maxLength={8}
              autoFocus
            />
            <button onClick={handleShowPin} className="text-xs underline">{showPin ? 'Скрыть' : 'Показать'} PIN</button>
            <button className={`w-full p-2 rounded ${btnStyle} mt-2`} onClick={handleEnter}>Войти</button>
            <button className="text-xs underline mt-1" onClick={handleChange}>Сменить PIN</button>
            <button className="text-xs underline mt-1" onClick={handleReset}>Сбросить блокировку</button>
          </>
        )}
        {step === 'set' && (
          <>
            <div>Установите новый PIN (минимум 4 цифры)</div>
            <input
              type={showPin ? 'text' : 'password'}
              className={`w-full p-2 rounded border ${inputStyle}`}
              value={input}
              onChange={handleInput}
              maxLength={8}
              autoFocus
            />
            <button onClick={handleShowPin} className="text-xs underline">{showPin ? 'Скрыть' : 'Показать'} PIN</button>
            <button className={`w-full p-2 rounded ${btnStyle} mt-2`} onClick={handleSet}>Установить</button>
          </>
        )}
        {step === 'confirm' && (
          <>
            <div>Повторите PIN</div>
            <input
              type={showPin ? 'text' : 'password'}
              className={`w-full p-2 rounded border ${inputStyle}`}
              value={input}
              onChange={handleInput}
              maxLength={8}
              autoFocus
            />
            <button onClick={handleShowPin} className="text-xs underline">{showPin ? 'Скрыть' : 'Показать'} PIN</button>
            <button className={`w-full p-2 rounded ${btnStyle} mt-2`} onClick={handleConfirm}>Подтвердить</button>
          </>
        )}
        {step === 'old' && (
          <>
            <div>Введите текущий PIN</div>
            <input
              type={showPin ? 'text' : 'password'}
              className={`w-full p-2 rounded border ${inputStyle}`}
              value={input}
              onChange={handleInput}
              maxLength={8}
              autoFocus
            />
            <button onClick={handleShowPin} className="text-xs underline">{showPin ? 'Скрыть' : 'Показать'} PIN</button>
            <button className={`w-full p-2 rounded ${btnStyle} mt-2`} onClick={handleOld}>Далее</button>
            <button className="text-xs underline mt-1" onClick={() => setStep('enter')}>Отмена</button>
          </>
        )}
        {step === 'new' && (
          <>
            <div>Введите новый PIN (минимум 4 цифры)</div>
            <input
              type={showPin ? 'text' : 'password'}
              className={`w-full p-2 rounded border ${inputStyle}`}
              value={input}
              onChange={handleInput}
              maxLength={8}
              autoFocus
            />
            <button onClick={handleShowPin} className="text-xs underline">{showPin ? 'Скрыть' : 'Показать'} PIN</button>
            <button className={`w-full p-2 rounded ${btnStyle} mt-2`} onClick={handleNew}>Далее</button>
          </>
        )}
        {step === 'confirmNew' && (
          <>
            <div>Повторите новый PIN</div>
            <input
              type={showPin ? 'text' : 'password'}
              className={`w-full p-2 rounded border ${inputStyle}`}
              value={input}
              onChange={handleInput}
              maxLength={8}
              autoFocus
            />
            <button onClick={handleShowPin} className="text-xs underline">{showPin ? 'Скрыть' : 'Показать'} PIN</button>
            <button className={`w-full p-2 rounded ${btnStyle} mt-2`} onClick={handleConfirmNew}>Подтвердить</button>
          </>
        )}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default LockScreen; 