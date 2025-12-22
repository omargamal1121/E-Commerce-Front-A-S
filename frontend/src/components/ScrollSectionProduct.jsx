import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ScrollSection = ({ scroll1, scroll2 }) => {
    const { t } = useTranslation();
    const scrollRef = useRef(null);
    const autoScrollRef = useRef();
    const resumeTimeout = useRef();

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;
        let animationFrame;
        const speed = 3; // pixels per frame (increased for faster scroll)
        let paused = false;

        function autoScroll() {
            if (!paused) {
                if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
                    scrollContainer.scrollLeft = 0;
                } else {
                    scrollContainer.scrollLeft += speed;
                }
            }
            animationFrame = requestAnimationFrame(autoScroll);
        }
        autoScrollRef.current = () => {
            paused = false;
        };
        animationFrame = requestAnimationFrame(autoScroll);

        // Pause auto-scroll on user interaction, resume after 2s
        const pauseScroll = () => {
            paused = true;
            clearTimeout(resumeTimeout.current);
            resumeTimeout.current = setTimeout(() => {
                paused = false;
            });
        };
        scrollContainer.addEventListener('mousedown', pauseScroll);
        scrollContainer.addEventListener('touchstart', pauseScroll);
        scrollContainer.addEventListener('wheel', pauseScroll);
        scrollContainer.addEventListener('scroll', pauseScroll);

        return () => {
            cancelAnimationFrame(animationFrame);
            scrollContainer.removeEventListener('mousedown', pauseScroll);
            scrollContainer.removeEventListener('touchstart', pauseScroll);
            scrollContainer.removeEventListener('wheel', pauseScroll);
            scrollContainer.removeEventListener('scroll', pauseScroll);
            clearTimeout(resumeTimeout.current);
        };
    }, []);

    // Responsive text and image sizes
    const textClass = 'font-bold text-center text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white';
    const imgClass = 'object-cover w-20 h-28 sm:w-24 sm:h-36 md:w-[100px] md:h-[150px] text-white';

    // Duplicate content enough times for seamless infinite scroll
    const items = [
        { img: scroll1, text: t('DRIP_IN_STYLE') },
        { img: scroll2, text: t('OWN_THE_STREETS') },
        { img: scroll1, text: t('DRIP_IN_STYLE') },
        { img: scroll2, text: t('OWN_THE_STREETS') },
        { img: scroll1, text: t('DRIP_IN_STYLE') },
        { img: scroll2, text: t('OWN_THE_STREETS') },
    ];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { 
            opacity: 0, 
            y: 50,
            scale: 0.8
        },
        visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: { 
                duration: 0.6,
                ease: "easeOut"
            }
        },
    };

    const hoverVariants = {
        hover: {
            scale: 1.05,
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div 
            className='mt-10 py-20 border-t border-gray-200 overflow-x-auto whitespace-nowrap bg-[#1b1c26] px-4 sm:px-[2vw] md:px-[2vw] lg:px-[3vw] text-white' 
            ref={scrollRef} 
            style={{ scrollBehavior: 'smooth' }}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
        >
            {items.map((item, idx) => (
                <motion.div 
                    className='inline-flex items-center' 
                    key={idx}
                    variants={itemVariants}
                    whileHover="hover"
                    hoverVariants={hoverVariants}
                >
                    <motion.img 
                        src={item.img} 
                        alt={item.text + idx} 
                        className={imgClass}
                        whileHover={{
                            rotate: [0, -5, 5, 0],
                            transition: { duration: 0.5 }
                        }}
                    />
                    <motion.p 
                        className={textClass}
                    >
                        {item.text}
                    </motion.p>
                </motion.div>
            ))}
        </motion.div>
    )
}

export default ScrollSection