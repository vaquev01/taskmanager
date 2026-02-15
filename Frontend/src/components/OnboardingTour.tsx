import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export const OnboardingTour = () => {
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('onboarding_completed');

        if (!hasSeenTour) {
            const driverObj = driver({
                showProgress: true,
                steps: [
                    {
                        element: 'aside',
                        popover: {
                            title: 'Navegação',
                            description: 'Acesse o Painel, Calendário e Equipe por aqui.',
                            side: "right",
                            align: 'start'
                        }
                    },
                    {
                        element: '.kanban-board',
                        popover: {
                            title: 'Gestão de Tarefas',
                            description: 'Arraste e solte tarefas para mudar o status.',
                            side: "top",
                            align: 'center'
                        }
                    },
                    {
                        element: '[cmdk-input-wrapper=""]',
                        popover: {
                            title: 'Busca Global',
                            description: 'Pressione Cmd+K para buscar qualquer coisa rapidamente.',
                            side: "bottom",
                            align: 'center'
                        }
                    },
                    {
                        element: 'header',
                        popover: {
                            title: 'Bem-vindo!',
                            description: 'Aproveite o TaskFlow 2.0. Seu trabalho, mais fluido.',
                            side: "bottom",
                            align: 'end'
                        }
                    }
                ],
                onDestroyStarted: () => {
                    localStorage.setItem('onboarding_completed', 'true');
                    driverObj.destroy();
                }
            });

            // Small delay to ensure DOM is ready
            setTimeout(() => {
                driverObj.drive();
            }, 1000);
        }
    }, []);

    return null; // This component renders nothing itself
};
