import React, { useState, useEffect, useRef, useMemo } from 'react';

// Word-aligned bilingual token pairs for each Shinkai film and HUD title
const MOVIE_WORD_PAIRS = {
    suzume: {
        en: ['Su', 'zu', 'me'],
        ja: ['すずめ', 'の', '戸締まり'],
    },
    'weathering-with-you': {
        en: ['Weathering ', 'with ', 'You'],
        ja: ['天気', 'の', '子'],
    },
    'your-name': {
        en: ['Your ', 'Name.'],
        ja: ['君の', '名は。'],
    },
    'garden-of-words': {
        en: ['The ', 'Garden ', 'of ', 'Words'],
        ja: ['言', 'の', '葉の', '庭'],
    },
    'children-who-chase-lost-voices': {
        en: ['Children ', 'Who ', 'Chase ', 'Lost ', 'Voices'],
        ja: ['星', 'を', '追う', '子', 'ども'],
    },
    '5-centimeters-per-second': {
        en: ['5 ', 'Centimeters ', 'per ', 'Second'],
        ja: ['秒速', '5', 'センチ', 'メートル'],
    },
    'place-promised-in-our-early-days': {
        en: ['The ', 'Place ', 'Promised ', 'in ', 'Our ', 'Early ', 'Days'],
        ja: ['雲', 'の', 'むこう、', '約束', 'の', '場', '所'],
    },
    'voices-of-a-distant-star': {
        en: ['Voices ', 'of ', 'a ', 'Distant ', 'Star'],
        ja: ['ほ', 'し', 'の', 'こ', 'え'],
    },
    'she-and-her-cat': {
        en: ['She ', 'and ', 'Her ', 'Cat'],
        ja: ['彼女', 'と', '彼女の', '猫'],
    },
};

function buildAlignedTokens(primaryText = '', secondaryText = '', movieId = null, reverse = false) {
    if (movieId && MOVIE_WORD_PAIRS[movieId]) {
        const pair = MOVIE_WORD_PAIRS[movieId];
        return reverse
            ? { fromTokens: pair.ja, toTokens: pair.en }
            : { fromTokens: pair.en, toTokens: pair.ja };
    }

    // Generic word-aligned splitter for custom phrases
    const splitWords = (str) => {
        const words = str.trim().split(/\s+/).filter(Boolean);
        if (words.length > 1) {
            return words.map((w, i) => (i < words.length - 1 ? `${w} ` : w));
        }
        // Single word or continuous CJK string: split into 3 balanced chunks
        const chars = Array.from(str);
        if (chars.length <= 1) return [str];
        const size = Math.ceil(chars.length / 3);
        const chunks = [];
        for (let i = 0; i < chars.length; i += size) {
            chunks.push(chars.slice(i, i + size).join(''));
        }
        return chunks;
    };

    const fromRaw = splitWords(primaryText);
    const toRaw = splitWords(secondaryText);
    const count = Math.max(fromRaw.length, toRaw.length);

    // Resample toTokens so every fromToken slot has a 1-to-1 counterpart
    const fromTokens = [];
    const toTokens = [];
    const toChars = Array.from(secondaryText);

    if (fromRaw.length === toRaw.length) {
        return { fromTokens: fromRaw, toTokens: toRaw };
    }

    for (let i = 0; i < fromRaw.length; i++) {
        fromTokens.push(fromRaw[i]);
        const start = Math.floor((i / fromRaw.length) * toChars.length);
        const end = Math.floor(((i + 1) / fromRaw.length) * toChars.length);
        toTokens.push(toChars.slice(start, end).join(''));
    }

    return { fromTokens, toTokens };
}

export default function BilingualWordSwap({
    primaryText,
    secondaryText,
    fromWords = null,
    toWords = null,
    movieId = null,
    reverse = false,
    externalHover = null,
    stepMs = 115,
    className = '',
    as: Tag = 'span',
}) {
    const { fromTokens, toTokens } = useMemo(() => {
        if (fromWords && toWords && fromWords.length === toWords.length) {
            return { fromTokens: fromWords, toTokens: toWords };
        }
        return buildAlignedTokens(primaryText, secondaryText, movieId, reverse);
    }, [primaryText, secondaryText, fromWords, toWords, movieId, reverse]);

    const totalWords = fromTokens.length;
    const [swappedCount, setSwappedCount] = useState(0);
    const [internalHover, setInternalHover] = useState(false);
    const activeHover = externalHover !== null ? externalHover : internalHover;
    const hasInteractedRef = useRef(false);

    // Reset when movie or primaryText changes
    useEffect(() => {
        hasInteractedRef.current = false;
        setSwappedCount(0);
        setInternalHover(false);
    }, [primaryText, secondaryText, movieId]);

    // Step word-by-word toward target language on hover, and back on mouse leave
    useEffect(() => {
        if (activeHover) {
            hasInteractedRef.current = true;
        }
        if (!hasInteractedRef.current) return;

        // Immediately flip the first word on hover/unhover, then stagger the remaining words
        setSwappedCount((prev) => {
            if (activeHover) {
                return Math.min(totalWords, prev + 1);
            }
            return Math.max(0, prev - 1);
        });

        const timer = setInterval(() => {
            setSwappedCount((prev) => {
                if (activeHover) {
                    if (prev >= totalWords) {
                        clearInterval(timer);
                        return totalWords;
                    }
                    return prev + 1;
                } else {
                    if (prev <= 0) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                }
            });
        }, stepMs);

        return () => clearInterval(timer);
    }, [activeHover, totalWords, stepMs]);

    return (
        <Tag
            onMouseEnter={() => setInternalHover(true)}
            onMouseLeave={() => setInternalHover(false)}
            className={`inline-block cursor-pointer select-none ${className}`}
        >
            {fromTokens.map((fromWord, idx) => {
                const isSwapped = idx < swappedCount;
                const displayWord = isSwapped ? toTokens[idx] : fromWord;
                return (
                    <span
                        key={`${idx}-${isSwapped ? 'to' : 'from'}`}
                        className={`inline-block ${
                            hasInteractedRef.current ? 'animate-wordFlip' : ''
                        }`}
                        style={{ whiteSpace: 'pre' }}
                    >
                        {displayWord}
                    </span>
                );
            })}
        </Tag>
    );
}
