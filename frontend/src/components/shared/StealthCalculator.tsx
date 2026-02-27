import { useState } from 'react';
import { useStealth } from '../../context/StealthContext';

export default function StealthCalculator() {
    const { exitStealth } = useStealth();
    const [display, setDisplay] = useState('0');
    const [prev, setPrev] = useState('');
    const [op, setOp] = useState('');

    const press = (v: string) => {
        if (v === 'AC') { exitStealth(); return; }           // Secret exit
        if (v === '=') {
            try { setDisplay(String(eval(`${prev}${op}${display}`))); }
            catch { setDisplay('Error'); }
            setPrev(''); setOp(''); return;
        }
        if (['+', '-', '×', '÷'].includes(v)) {
            setPrev(display);
            setOp(v === '×' ? '*' : v === '÷' ? '/' : v);
            setDisplay('0'); return;
        }
        if (v === '%') { setDisplay(String(parseFloat(display) / 100)); return; }
        if (v === '+/-') { setDisplay(String(-parseFloat(display))); return; }
        setDisplay(p => p === '0' ? v : p + v);
    };

    const rows = [
        ['AC', '+/-', '%', '÷'],
        ['7', '8', '9', '×'],
        ['4', '5', '6', '-'],
        ['1', '2', '3', '+'],
        ['0', '.', '='],
    ];

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="bg-gray-900 rounded-3xl p-5 w-80 shadow-2xl">
                <div className="text-white text-right text-5xl font-light pb-4 overflow-hidden px-2 min-h-[72px]">
                    {display.length > 9 ? parseFloat(display).toExponential(3) : display}
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {rows.flat().map((btn, i) => {
                        const isOp = ['+', '-', '×', '÷', '='].includes(btn);
                        const isFunc = ['AC', '+/-', '%'].includes(btn);
                        const isZero = btn === '0';
                        return (
                            <button key={i} onClick={() => press(btn)}
                                className={`h-16 rounded-full text-xl font-medium active:opacity-70 transition-opacity
                  ${isZero ? 'col-span-2 text-left pl-7 bg-gray-700 text-white' :
                                        isOp ? 'bg-orange-500 text-white' :
                                            isFunc ? 'bg-gray-500 text-white' :
                                                'bg-gray-700 text-white'}`}
                            >
                                {btn === 'AC' ? <span title="Tap AC to exit stealth mode">AC</span> : btn}
                            </button>
                        );
                    })}
                </div>
                <p className="text-center text-gray-700 text-xs mt-4">Tap AC to exit</p>
            </div>
        </div>
    );
}
