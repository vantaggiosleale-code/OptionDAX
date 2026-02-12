// Test confronto calcolo VI tra Option DAX e calcolatore riferimento

// Parametri identici
const S = 25003;
const K = 25100;
const marketPrice = 405;
const valutazione = new Date('2026-02-12');
const scadenza = new Date('2026-03-20');
const r = 0.02;

// Calcolo Time to Expiry (giorni di calendario / 365)
const diffMs = scadenza.getTime() - valutazione.getTime();
const timeToExpiry = diffMs / (365 * 24 * 60 * 60 * 1000);

console.log('=== PARAMETRI TEST ===');
console.log('Spot DAX:', S);
console.log('Strike:', K);
console.log('Market Price:', marketPrice);
console.log('Valutazione:', valutazione.toISOString().split('T')[0]);
console.log('Scadenza:', scadenza.toISOString().split('T')[0]);
console.log('Risk-Free Rate:', r);
console.log('Time to Expiry (anni):', timeToExpiry);
console.log('Time to Expiry (giorni):', timeToExpiry * 365);
console.log('');

// Importa funzioni Option DAX
import('./shared/blackScholes.js').then(bs => {
    console.log('=== OPTION DAX ===');
    const ivResult = bs.calculateImpliedVolatility({
        targetPrice: marketPrice,
        spotPrice: S,
        strikePrice: K,
        timeToExpiry: timeToExpiry,
        riskFreeRate: r,
        optionType: 'call'
    });
    
    console.log('VI Calcolata:', ivResult.impliedVolatility, '%');
    console.log('Converged:', ivResult.converged);
    console.log('Iterations:', ivResult.iterations);
    console.log('');
    console.log('ATTESO: 13.67%');
    console.log('DIFFERENZA:', (ivResult.impliedVolatility - 13.67).toFixed(2), '%');
}).catch(err => {
    console.error('Errore import:', err);
});
