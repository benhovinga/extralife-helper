import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import alertSfx from './assets/audio/alert.mp3';
import classNames from 'classnames';
import ErrorView from './components/ErrorView';
import InfoView from './components/InfoView';
import useExtraLifeData from './hooks/useExtraLifeData';
import useHelperSettings from './hooks/useHelperSettings';
import useSound from 'use-sound';

function App() {
    const [errorMessage, setErrorMessage] = useState(undefined);
    const [totalDonations, setTotalDontaions] = useState(undefined);
    const { t, i18n } = useTranslation();
    const [playSound, { sound }] = useSound(alertSfx);
    const helperSettings = useHelperSettings();
    const extraLife = useExtraLifeData(undefined);
    const getRefreshedDataTimer = useRef();

    useEffect(() => {
        clearInterval(getRefreshedDataTimer?.current);
        getRefreshedDataTimer.current = setInterval(() => {
            console.log('Refreshing data...');
            extraLife.refreshData();
        }, import.meta.env.VITE_POLLING_INTERVAL);
        return () => {
            clearInterval(getRefreshedDataTimer?.current);
        };
    }, [extraLife.refreshData, getRefreshedDataTimer]);

    useEffect(() => {
        const onKeyPress = evt => {
            switch (evt.key) {
                case 's':
                    sound.play();
                default:
                    // Do nothing.
            }
        };
        if (['DEV', 'LOCAL'].includes(import.meta.env.VITE_RUNTIME_MODE)) {
            document.addEventListener('keypress', onKeyPress);
        }
        return () => {
            document.removeEventListener('keypress', onKeyPress);
        };
    }, [playSound]);

    useEffect(() => {
        if (helperSettings?.error !== undefined) {
            setErrorMessage(helperSettings.error);
            return;
        }

        if (helperSettings?.data === undefined) {
            return;
        }

        if (i18n.language !== helperSettings.data.lang) {
            i18n.changeLanguage(helperSettings.data.lang);
        }

        if (sound) {
            sound.volume(helperSettings.data?.volume || 1);
        }

        document.documentElement.classList.add(helperSettings.data.theme);

        extraLife.setRequestOptions(
            helperSettings.data.participantId ? 'participants' : 'teams',
            helperSettings.data.participantId || helperSettings.data.teamId,
        );
    }, [helperSettings.data, helperSettings.error, sound]);

    useEffect(() => {
        if (!extraLife.data) {
            return;
        }

        if (totalDonations !== undefined && extraLife.data.numDonations > totalDonations) {
            console.log('Make a request for donations!');
        }

        if (totalDonations !== extraLife.data.numDonations) {
            setTotalDontaions(extraLife.data.numDonations);
        }
    }, [extraLife.data]);

    useEffect(() => {
        const onWindowResize = () => {
            if (window.innerHeight > window.innerWidth) {
                setErrorMessage(t('PORTRAIT_NOT_ALLOWED'));
            } else {
                setErrorMessage(undefined);
            }
        }
        addEventListener('resize', onWindowResize);
        return () => {
            removeEventListener('resize', onWindowResize);
        };
    }, []);

    let content;
    if (errorMessage) {
        content = <ErrorView message={errorMessage} />;
    } else if (helperSettings.data) {
        content = <InfoView data={extraLife.data} settings={helperSettings.data} />
    } else {
        return null;
    }

    return (
        <div
            className={
                classNames(
                    `w-full h-screen flex flex-col items-center justify-center`,
                    `bg-helper2`,
                    helperSettings.data?.border === 'square' ? 'border-2 border-helper1' : '',
                    helperSettings.data?.border === 'rounded' ? 'border-2 border-helper1 rounded' : '',
                )
            }
        >
            {content}
        </div>
    )


}

export default App
