import { useMutation } from "@tanstack/react-query";
import * as Toast from "@radix-ui/react-toast";
import { default as ToastRoot } from "./components/toast";
import { error } from "./icons/error";
import { info } from "./icons/info";
import { success } from "./icons/success";
import useManageFilesUpload from "./hooks/use-manage-files-upload";
import type { Action } from "./types/action";
import FilesInput from "./components/files-input";
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import roomiesPicture from './assets/roomies.jpg'
import roomatchIcon from '../../assets/logo-no-letters.svg'
import { useState } from "react";

export default function Signup() {
    const { state, dispatch } = useManageFilesUpload();
    const [kindOfUser, setKindOfUser] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [errorsOnSubmit, setErrorsOnSubmit] = useState<string[]>(["initialError"]);


    const handleFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return null;
        const uploadPromises = Array.from(files).map(async (file: File) => {
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', 'upload_preset');

            try {
                const res = await fetch('https://api.cloudinary.com/v1_1/dkao0yswo/upload', {
                    method: 'POST',
                    body: data
                });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const json = await res.json();
                return json.secure_url;
            } catch (error) {
                if (error instanceof Error) {
                    throw new Error(error.message);
                }
                throw new Error('Unknown error');
            }
        });

        const uploadedImages = await Promise.all(uploadPromises);
        dispatch({ type: "SET_IMAGES", payload: [...state.images, ...uploadedImages.filter(url => url !== null)] });
    };

    const filesMutation = useMutation({
        mutationFn: handleFilesUpload,
        onError: () => { if (state.isUploadErrorNotificationOpened) dispatch({ type: "TOGGLE_ERROR_NOTIFICATION" }) },
        onMutate: () => {
            if (state.isUploadSuccessNotificationOpened) dispatch({ type: "TOGGLE_INFO_NOTIFICATION" });
            if (!state.isUploadInfoNotificationOpened) dispatch({ type: "TOGGLE_INFO_NOTIFICATION" });
        },
        onSuccess: () => {
            if (state.isUploadInfoNotificationOpened) dispatch({ type: "TOGGLE_INFO_NOTIFICATION" });
            if (!state.isUploadSuccessNotificationOpened) dispatch({ type: "TOGGLE_SUCCESS_NOTIFICATION" });
        },
        mutationKey: ['files'],
    });

    const signUpMutation = useMutation({
        mutationFn: async () => {
            const requestBody = {
                ['92']: state.images.join(';'),
            };
            await fetch(`https://api.jotform.com/submission/${inputValue}?apiKey=${import.meta.env.VITE_JOTFORM_APIKEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });
        },
        mutationKey: ['signup'],
    });

    const onOpenChangeProducer = (state: boolean, type: Action['type']) => () => { if (state) dispatch({ type } as Action) }

    const notifications = [{
        open: state.isUploadInfoNotificationOpened,
        onOpenChange: onOpenChangeProducer(state.isUploadInfoNotificationOpened, 'TOGGLE_INFO_NOTIFICATION'),
        icon: info,
        title: "Cargando imágenes...",
    },
    {
        open: state.isUploadSuccessNotificationOpened,
        onOpenChange: onOpenChangeProducer(state.isUploadSuccessNotificationOpened, 'TOGGLE_SUCCESS_NOTIFICATION'),
        icon: success,
        title: `${state.images.length} ${state.images.length == 1 ? 'imágen cargada' : 'imágenes cargadas'} exitosamente.`,
    },
    {
        open: state.isUploadErrorNotificationOpened,
        onOpenChange: onOpenChangeProducer(state.isUploadErrorNotificationOpened, 'TOGGLE_ERROR_NOTIFICATION'),
        icon: error,
        title: "Hubo un problema con la carga de tus imágenes, contactanos para ayudarte.",
    },
    {
        open: signUpMutation.isPending,
        onOpenChange: undefined,
        icon: info,
        title: "Te estamos registrando...",
    },
    {
        open: signUpMutation.isError,
        onOpenChange: undefined,
        icon: error,
        title: "Hubo un error en tu registro, escribenos para poder ayudarte.",
    },
    {
        open: signUpMutation.isSuccess,
        onOpenChange: undefined,
        icon: success,
        title: "Te has registrado exitosamente.",
    }];

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setInputValue(value);
        const isValid = /^\d{19}$/.test(value);

        if (!isValid && value.length > 0) {
            setErrorMessage("El ID no es valido. Tu ID lo encuentras en la pantalla final del formulario en el paso anterior.");
        } else {
            setErrorMessage("");
        }
    };

    const handleSubmit = async () => {

        if (!kindOfUser) setErrorsOnSubmit([...errorsOnSubmit, 'Selecciona tu situación de busqueda']);

        if (kindOfUser == 'RoomieSeek') {
            if (state.images.length !== 0) dispatch({ type: "SET_IMAGES", payload: [] });
            if (inputValue.length !== 0) setInputValue("");
        }

        if (kindOfUser == 'RoomieRent') {
            if ((errorMessage || inputValue.length !== 19)) setErrorMessage("Ingresa tu ID de envío.");
            if (state.images.length < 2) setErrorsOnSubmit([...errorsOnSubmit, 'Carga al menos dos imágenes']);
        }

        if (kindOfUser == 'RoomieRent' && !errorMessage && (errorsOnSubmit.length === 0 || (errorsOnSubmit.length === 1 && errorsOnSubmit[0] === 'initialError'))) signUpMutation.mutate();
        
    }

    return (
        <Toast.Provider duration={60000} swipeDirection="right">
            <Flex className="sm:h-dvh sm:overflow-hidden flex-col sm:flex-row gap-6 sm:gap-0">
                <img src={roomiesPicture} alt="Roomies hablando" className="sm:h-auto sm:w-1/3 object-cover rounded-2xl mx-6 mt-6 sm:my-6" />

                <Flex className="sm:pr-6 mx-6 sm:m-0 sm:w-2/3  sm:overflow-y-scroll sm:my-6" direction="column" gap="5">

                    <Flex direction="column" gap="2">
                        <Flex direction="row" align="center" gap="2" className="bg-seasalt pr-6 py-1 rounded-r-lg dark:bg-mirrage sm:fixed">
                            <img src={roomatchIcon} alt="Logo de Roomatch" className="w-10 h-10 p-1 bg-cerulean rounded-full bg-gradient-to-br to-cerulean from-prussian-blue" />
                            <Heading as="h1" weight="bold">Realiza tu registro</Heading>
                        </Flex>
                        <Text as="p" size="2" className="sm:mt-14">¡Bienvenido! ¿Estás listo para encontrar tus roomies ideales?</Text>
                    </Flex>
                    <Flex direction="column" gap="2">
                        <Heading as="h2" size="4" weight="bold">1. ¿Cuál es tu situación de busqueda?</Heading>
                        <Flex direction="row" gap="4" wrap="wrap" justify={{ initial: 'between', xs: 'start' }}>
                            <Button variant={kindOfUser == 'RoomieRent' ? 'solid' : 'surface'} size="1" className="py-5 cursor-pointer transition-all" asChild onClick={() => setKindOfUser('RoomieRent')} >
                                <span>Ya tengo apartamento y <br /> busco roomies</span>
                            </Button>
                            <Button variant={kindOfUser == 'RoomieSeek' ? 'solid' : 'surface'} size="1" className="py-5 cursor-pointer transition-all" asChild onClick={() => setKindOfUser('RoomieSeek')} >
                                <span>Busco habitación en un <br /> apartamento compartido</span>
                            </Button>
                        </Flex>
                        {errorsOnSubmit.includes('Selecciona tu situación de busqueda') && (
                            <Flex direction="row" gap="2" align="center">
                                {error}
                                <Text as="p" size="2" color="red">Selecciona tu situación de busqueda.</Text>
                            </Flex>
                        )}
                    </Flex>

                    <Flex direction="column" gap="2">
                        <Heading as="h2" size="4" weight="bold">2. Cuéntanos sobre ti y tus preferencias.</Heading>

                        <iframe
                            id="JotFormIFrame-240816995331664"
                            title="Registro de roomies"
                            onLoad={() => window.parent.scrollTo(0, 0)}
                            allowTransparency={true}
                            allow="geolocation; microphone; camera; fullscreen"
                            src="https://form.jotform.com/240816995331664"
                            className="h-96 w-full rounded-lg"
                        >

                        </iframe>
                        <script src='https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js'></script>
                        <script>window.jotformEmbedHandler("iframe[id='JotFormIFrame-240816995331664']", "https://form.jotform.com/")</script>
                    </Flex>

                    {kindOfUser == 'RoomieRent' ? <>
                        <Flex direction="column" gap="2">
                            <Heading as="h2" size="4" weight="bold">3. Copia y pega aquí tu ID de envío.</Heading>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleChange}
                                maxLength={19}
                                placeholder="Tu ID de envío."
                                className={`font-light text-sm border-[1px] border-[var(--violet-8)] hover:border-[var(--violet-9)] focus:outline-none focus:border-[var(--violet-12)] p-2 rounded-lg ${inputValue.length !== 19 ? 'bg-[var(--violet-2)] text-[var(--violet-8)]' : 'bg-[var(--violet-9)] text-white'} transition-colors`}
                            />
                            {errorMessage && (
                                <Flex direction="row" gap="2" align="center">
                                    {error}
                                    <Text as="p" size="2" color="red">{errorMessage}</Text>
                                </Flex>
                            )}
                        </Flex>

                        <Flex direction="column" gap="2">
                            <Heading as="h2" size="4" weight="bold">4. Muéstranos tu hogar.</Heading>
                            <FilesInput filesMutation={filesMutation} />
                            {errorsOnSubmit.includes('Carga al menos dos imágenes') && (
                                <Flex direction="row" gap="2" align="center">
                                    {error}
                                    <Text as="p" size="2" color="red">Carga al menos dos imágenes.</Text>
                                </Flex>
                            )}
                        </Flex>
                    </> : null}

                    <Container>
                        <Button className="hover:cursor-pointer transition-all" onClick={async () => await handleSubmit()} >
                            Registrarme
                        </Button>
                    </Container>

                    {notifications.map(({ open, onOpenChange, icon, title }) => (
                        <ToastRoot key={title} open={open} onOpenChange={onOpenChange} icon={icon} title={title} />
                    ))}

                    <Toast.Viewport className="fixed flex flex-col gap-2.5 w-96 max-w-[100vw] z-[2147483647] m-0 p-[25px] right-0 bottom-0 list-none outline-none" />
                </Flex>

            </Flex>
        </Toast.Provider>
    );
}