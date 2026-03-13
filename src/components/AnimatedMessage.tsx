import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

interface Props {
    content: string;
    animate?: boolean;
    speed?: number; // ms per character
}

export const AnimatedMessage: React.FC<Props> = ({ content, animate = false, speed = 15 }) => {
    const [displayedContent, setDisplayedContent] = useState(animate ? '' : content);

    useEffect(() => {
        if (!animate) {
            setDisplayedContent(content);
            return;
        }

        let i = 0;
        setDisplayedContent('');
        
        const interval = setInterval(() => {
            if (i < content.length - 1) {
                setDisplayedContent(prev => prev + content[i]);
                i++;
            } else {
                setDisplayedContent(content);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [content, animate, speed]);

    return (
        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 max-w-none text-base">
            <ReactMarkdown>
                {displayedContent}
            </ReactMarkdown>
            {animate && displayedContent.length < content.length && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-2 h-4 bg-white/50 ml-1 align-middle"
                />
            )}
        </div>
    );
};
