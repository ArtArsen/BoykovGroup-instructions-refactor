import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    useDispatch,
    useSelector
} from "react-redux";

import {
    searchInstructions,
    uploadInstruction
} from "../../store/instructionsSlice.js";

import {
    selectAuthToken
} from "../../store/authSlice.js";

import {
    createBulkImport,
    uploadBulkImportChunk,
    startBulkImport,
    getBulkImportProgress,
    getBulkImportFiles,
    stopBulkImport,
    resumeBulkImport
} from "../../api/instructionsApi.js";

import {
    ACCEPTED_EXTENSIONS,
    MAX_FILE_SIZE,
    MAX_FILES,
    POLL_INTERVAL,
    ACTIVE_BATCH_KEY,
    sleep,
    makeChunks,
    getStatusText
} from "./addInstructionBulkImportUtils.js";

import styles from "./AddInstructionButton.module.css";


export default function AddInstructionModal({
    onClose,
    onImportCreated
}) {

    const dispatch =
        useDispatch();

    const token =
        useSelector(
            selectAuthToken
        );

    const isUploading =
        useSelector(
            (state) =>
                state.instructions.isUploading
        );

    const uploadError =
        useSelector(
            (state) =>
                state.instructions.uploadError
        );

    const currentQuery =
        useSelector(
            (state) =>
                state.instructions.query
        );


    const [mode, setMode] =
        useState("file");

    const [manualText, setManualText] =
        useState("");

    const [files, setFiles] =
        useState([]);

    const [bulkPhase, setBulkPhase] =
        useState("idle");

    const [bulkBatchId, setBulkBatchId] =
        useState(null);

    const [uploadedCount, setUploadedCount] =
        useState(0);

    const [bulkProgress, setBulkProgress] =
        useState(null);

    const [bulkError, setBulkError] =
        useState(null);

    const [failedFiles, setFailedFiles] =
        useState([]);

    const fileInputRef =
        useRef(null);

    const pollingRunRef =
        useRef(0);


    const bulkBusy =
        [
            "creating",
            "uploading",
            "starting",
            "processing",
            "stopping"
        ].includes(
            bulkPhase
        );


    const isReady =
        mode === "file"
            ? files.length > 0
            : manualText.trim().length > 0;


    async function loadFailedFiles(
        batchId
    ) {

        try {

            const result =
                await getBulkImportFiles(
                    batchId,
                    token,
                    {
                        status:
                            "failed",

                        limit:
                            200
                    }
                );


            setFailedFiles(
                result?.items || []
            );

        }
        catch {

            /*
             * Основной import уже завершён.
             * Ошибка загрузки детализации не должна
             * менять его итоговый статус.
             */

        }

    }


    async function pollBatch(
        batchId
    ) {

        const runId =
            ++pollingRunRef.current;


        while (
            runId ===
            pollingRunRef.current
        ) {

            const progress =
                await getBulkImportProgress(
                    batchId,
                    token
                );


            if (
                runId !==
                pollingRunRef.current
            ) {
                return;
            }


            setBulkProgress(
                progress
            );


            if (
                progress.status ===
                "completed"
            ) {

                setBulkPhase(
                    "completed"
                );

                localStorage.removeItem(
                    ACTIVE_BATCH_KEY
                );


                await loadFailedFiles(
                    batchId
                );


                dispatch(
                    searchInstructions({
                        query:
                            currentQuery,

                        page:
                            1
                    })
                );


                return;
            }


            if (
                progress.status ===
                "paused"
            ) {

                setBulkPhase(
                    "paused"
                );

                return;
            }


            setBulkPhase(
                "processing"
            );


            await sleep(
                POLL_INTERVAL
            );

        }

    }


    /*
     * Если обработка уже была запущена,
     * но пользователь закрыл/перезагрузил страницу,
     * при следующем открытии модалки снова подключаемся
     * к progress API.
     */
    useEffect(
        () => {

            if (!token) {
                return;
            }


            const storedBatchId =
                localStorage.getItem(
                    ACTIVE_BATCH_KEY
                );


            if (!storedBatchId) {
                return;
            }


            let cancelled =
                false;


            (async () => {

                try {

                    const progress =
                        await getBulkImportProgress(
                            storedBatchId,
                            token
                        );


                    if (cancelled) {
                        return;
                    }


                    setBulkBatchId(
                        storedBatchId
                    );

                    setBulkProgress(
                        progress
                    );


                    if (
                        progress.status ===
                        "completed"
                    ) {

                        setBulkPhase(
                            "completed"
                        );

                        localStorage.removeItem(
                            ACTIVE_BATCH_KEY
                        );

                        await loadFailedFiles(
                            storedBatchId
                        );

                        return;
                    }


                    if (
                        progress.status ===
                        "paused"
                    ) {

                        setBulkPhase(
                            "paused"
                        );

                        return;
                    }


                    if (
                        progress.status ===
                        "running"
                    ) {

                        setBulkPhase(
                            "processing"
                        );

                        await pollBatch(
                            storedBatchId
                        );

                        return;
                    }


                    /*
                     * uploading означает, что браузер
                     * не успел отправить все File objects
                     * перед перезагрузкой.
                     *
                     * Автоматически продолжить transfer
                     * браузер уже не может.
                     */
                    localStorage.removeItem(
                        ACTIVE_BATCH_KEY
                    );

                }
                catch {

                    localStorage.removeItem(
                        ACTIVE_BATCH_KEY
                    );

                }

            })();


            return () => {

                cancelled =
                    true;

                pollingRunRef.current++;

            };

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [token]
    );


    useEffect(
        () => {

            function handleKeyDown(e) {

                if (
                    e.key === "Escape" &&
                    !bulkBusy &&
                    !isUploading
                ) {
                    onClose();
                }

            }


            document.addEventListener(
                "keydown",
                handleKeyDown
            );


            return () => {

                document.removeEventListener(
                    "keydown",
                    handleKeyDown
                );

            };

        },
        [
            onClose,
            bulkBusy,
            isUploading
        ]
    );


    function validateFiles() {

        if (
            files.length >
            MAX_FILES
        ) {
            throw new Error(
                `За один импорт можно выбрать не более ${MAX_FILES} файлов`
            );
        }


        const tooLarge =
            files.find(
                (file) =>
                    file.size >
                    MAX_FILE_SIZE
            );


        if (tooLarge) {

            throw new Error(
                `Файл "${tooLarge.name}" превышает лимит 15 МБ`
            );

        }

    }


    async function handleBulkSubmit() {

        validateFiles();


        setBulkError(null);

        setFailedFiles([]);

        setUploadedCount(0);

        setBulkProgress(null);

        setBulkPhase(
            "creating"
        );


        const created =
            await createBulkImport(
                files.length,
                token
            );


        const batchId =
            created.id;


        setBulkBatchId(
            batchId
        );

        setBulkProgress(
            created
        );

        setBulkPhase(
            "uploading"
        );


        const chunks =
            makeChunks(files);

        let uploaded =
            0;


        for (
            const chunk
            of chunks
        ) {

            const progress =
                await uploadBulkImportChunk(
                    batchId,
                    chunk,
                    token
                );


            uploaded +=
                chunk.length;


            setUploadedCount(
                uploaded
            );

            setBulkProgress(
                progress
            );

        }


        setBulkPhase(
            "starting"
        );


        const started =
            await startBulkImport(
                batchId,
                token
            );


        setBulkProgress(
            started
        );


        localStorage.setItem(
            ACTIVE_BATCH_KEY,
            batchId
        );


        setBulkPhase(
            "processing"
        );


        await pollBatch(
            batchId
        );

    }


    async function handleManualSubmit() {

        const formData =
            new FormData();


        formData.append(
            "content",
            manualText.trim()
        );


        const result =
            await dispatch(
                uploadInstruction(
                    formData
                )
            );


        if (
            result?.importId
        ) {

            onImportCreated(
                result.importId
            );

        }

    }


    async function handleSubmit(e) {

        e.preventDefault();


        if (
            !isReady ||
            bulkBusy ||
            isUploading
        ) {
            return;
        }


        try {

            if (
                mode === "file"
            ) {

                await handleBulkSubmit();

            }
            else {

                await handleManualSubmit();

            }

        }
        catch (error) {

            console.error(
                "Bulk import error:",
                error
            );


            setBulkError(
                error?.message ||
                "Ошибка массового импорта"
            );


            setBulkPhase(
                "error"
            );

        }

    }


    async function handleStop() {

        if (
            !bulkBatchId ||
            bulkPhase !== "processing"
        ) {
            return;
        }


        try {

            setBulkPhase(
                "stopping"
            );


            const progress =
                await stopBulkImport(
                    bulkBatchId,
                    token
                );


            pollingRunRef.current++;


            setBulkProgress(
                progress
            );

            setBulkPhase(
                "paused"
            );

        }
        catch (error) {

            setBulkError(
                error?.message ||
                "Не удалось остановить импорт"
            );

            setBulkPhase(
                "error"
            );

        }

    }


    async function handleResume() {

        if (
            !bulkBatchId ||
            bulkPhase !== "paused"
        ) {
            return;
        }


        try {

            setBulkError(null);


            const progress =
                await resumeBulkImport(
                    bulkBatchId,
                    token
                );


            setBulkProgress(
                progress
            );


            localStorage.setItem(
                ACTIVE_BATCH_KEY,
                bulkBatchId
            );


            setBulkPhase(
                "processing"
            );


            await pollBatch(
                bulkBatchId
            );

        }
        catch (error) {

            setBulkError(
                error?.message ||
                "Не удалось продолжить импорт"
            );

            setBulkPhase(
                "error"
            );

        }

    }


    const processingDone =
        (
            bulkProgress?.completed ||
            0
        ) +
        (
            bulkProgress?.failed ||
            0
        );


    const processingTotal =
        bulkProgress?.total ||
        files.length ||
        0;


    const statusText =
        getStatusText(
            bulkPhase,
            bulkProgress
        );


    return (

        <div
            className={styles.overlay}

            onClick={
                () => {

                    if (
                        !bulkBusy &&
                        !isUploading
                    ) {
                        onClose();
                    }

                }
            }
        >

            <div
                className={styles.modal}

                role="dialog"

                aria-modal="true"

                onClick={
                    (e) =>
                        e.stopPropagation()
                }
            >

                <button
                    type="button"

                    className={styles.close}

                    disabled={
                        bulkBusy ||
                        isUploading
                    }

                    onClick={onClose}
                >
                    ×
                </button>


                <h2
                    className={styles.title}
                >
                    Добавить инструкцию
                </h2>


                {
                    bulkPhase === "idle"
                    ? (

                        <>

                            <div
                                className={
                                    styles.modeSwitch
                                }
                            >

                                <button
                                    type="button"

                                    className={
                                        mode === "file"
                                            ? styles.modeBtnActive
                                            : styles.modeBtn
                                    }

                                    onClick={
                                        () =>
                                            setMode("file")
                                    }
                                >
                                    Файлы
                                </button>


                                <button
                                    type="button"

                                    className={
                                        mode === "text"
                                            ? styles.modeBtnActive
                                            : styles.modeBtn
                                    }

                                    onClick={
                                        () =>
                                            setMode("text")
                                    }
                                >
                                    Текст
                                </button>

                            </div>


                            <form
                                onSubmit={
                                    handleSubmit
                                }

                                className={
                                    styles.form
                                }
                            >

                                {
                                    mode === "file"
                                    ? (

                                        <label
                                            className={
                                                styles.field
                                            }
                                        >

                                            <span
                                                className={
                                                    styles.label
                                                }
                                            >
                                                Выберите документы
                                            </span>


                                            <input
                                                ref={
                                                    fileInputRef
                                                }

                                                className={
                                                    styles.fileInput
                                                }

                                                type="file"

                                                multiple

                                                accept={
                                                    ACCEPTED_EXTENSIONS
                                                }

                                                onChange={
                                                    (e) => {

                                                        setBulkError(
                                                            null
                                                        );

                                                        setFiles(
                                                            Array.from(
                                                                e.target.files ||
                                                                []
                                                            )
                                                        );

                                                    }
                                                }
                                            />


                                            {
                                                files.length > 0 &&
                                                (

                                                    <div
                                                        className={
                                                            styles.fileHint
                                                        }
                                                    >
                                                        Выбрано файлов:{" "}
                                                        {files.length}
                                                    </div>

                                                )
                                            }

                                        </label>

                                    )
                                    : (

                                        <label
                                            className={
                                                styles.field
                                            }
                                        >

                                            <span
                                                className={
                                                    styles.label
                                                }
                                            >
                                                Текст инструкции
                                            </span>


                                            <textarea
                                                className={
                                                    styles.textarea
                                                }

                                                value={
                                                    manualText
                                                }

                                                onChange={
                                                    (e) =>
                                                        setManualText(
                                                            e.target.value
                                                        )
                                                }

                                                rows={8}
                                            />

                                        </label>

                                    )
                                }


                                {
                                    (
                                        bulkError ||
                                        uploadError
                                    ) &&
                                    (

                                        <p
                                            className={
                                                styles.error
                                            }
                                        >
                                            {
                                                bulkError ||
                                                uploadError
                                            }
                                        </p>

                                    )
                                }


                                <button
                                    type="submit"

                                    className={
                                        styles.submit
                                    }

                                    disabled={
                                        isUploading ||
                                        bulkBusy ||
                                        !isReady
                                    }
                                >

                                    {
                                        isUploading
                                            ? "Загрузка..."
                                            : (
                                                mode === "file"
                                                    ? `Импортировать ${files.length || ""}`
                                                    : "Добавить"
                                            )
                                    }

                                </button>

                            </form>

                        </>

                    )
                    : (

                        <div
                            className={
                                styles.bulkPanel
                            }
                        >

                            <div
                                className={
                                    styles.bulkStatus
                                }
                            >
                                {statusText}
                            </div>


                            {
                                bulkBatchId &&
                                (

                                    <div
                                        className={
                                            styles.bulkId
                                        }
                                    >
                                        ID: {bulkBatchId}
                                    </div>

                                )
                            }


                            {
                                bulkPhase === "uploading" &&
                                (

                                    <>

                                        <div
                                            className={
                                                styles.progressLabel
                                            }
                                        >
                                            Загружено на сервер:{" "}
                                            {uploadedCount} / {files.length}
                                        </div>


                                        <div
                                            className={
                                                styles.progressTrack
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.progressBar
                                                }

                                                style={{
                                                    width:
                                                        `${
                                                            files.length
                                                                ? Math.round(
                                                                    uploadedCount /
                                                                    files.length *
                                                                    100
                                                                )
                                                                : 0
                                                        }%`
                                                }}
                                            />
                                        </div>

                                    </>

                                )
                            }


                            {
                                [
                                    "starting",
                                    "processing",
                                    "stopping",
                                    "paused",
                                    "completed"
                                ].includes(
                                    bulkPhase
                                ) &&
                                bulkProgress &&
                                (

                                    <>

                                        <div
                                            className={
                                                styles.progressLabel
                                            }
                                        >
                                            Обработано:{" "}
                                            {processingDone} / {processingTotal}
                                        </div>


                                        <div
                                            className={
                                                styles.progressTrack
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.progressBar
                                                }

                                                style={{
                                                    width:
                                                        `${bulkProgress.progress || 0}%`
                                                }}
                                            />
                                        </div>


                                        <div
                                            className={
                                                styles.bulkStats
                                            }
                                        >

                                            <div>
                                                В очереди:{" "}
                                                <strong>
                                                    {bulkProgress.waiting || 0}
                                                </strong>
                                            </div>

                                            <div>
                                                Обрабатывается:{" "}
                                                <strong>
                                                    {bulkProgress.processing || 0}
                                                </strong>
                                            </div>

                                            <div>
                                                Успешно:{" "}
                                                <strong>
                                                    {bulkProgress.completed || 0}
                                                </strong>
                                            </div>

                                            <div>
                                                Ошибок:{" "}
                                                <strong>
                                                    {bulkProgress.failed || 0}
                                                </strong>
                                            </div>

                                            <div>
                                                Новых:{" "}
                                                <strong>
                                                    {bulkProgress.created || 0}
                                                </strong>
                                            </div>

                                            <div>
                                                Дубликатов:{" "}
                                                <strong>
                                                    {bulkProgress.duplicates || 0}
                                                </strong>
                                            </div>

                                            <div>
                                                Новых версий:{" "}
                                                <strong>
                                                    {bulkProgress.updatedVersions || 0}
                                                </strong>
                                            </div>

                                        </div>

                                    </>

                                )
                            }


                            {
                                bulkError &&
                                (

                                    <p
                                        className={
                                            styles.error
                                        }
                                    >
                                        {bulkError}
                                    </p>

                                )
                            }


                            {
                                failedFiles.length > 0 &&
                                (

                                    <div
                                        className={
                                            styles.failedFiles
                                        }
                                    >

                                        <strong>
                                            Ошибки файлов
                                        </strong>


                                        {
                                            failedFiles.map(
                                                (file) => (

                                                    <div
                                                        key={
                                                            file.id
                                                        }

                                                        className={
                                                            styles.failedFile
                                                        }
                                                    >

                                                        <div>
                                                            {file.name}
                                                        </div>

                                                        <div>
                                                            {
                                                                file.error ||
                                                                "Ошибка обработки"
                                                            }
                                                        </div>

                                                    </div>

                                                )
                                            )
                                        }

                                    </div>

                                )
                            }


                            <div
                                className={
                                    styles.bulkActions
                                }
                            >

                                {
                                    bulkPhase === "processing" &&
                                    (

                                        <button
                                            type="button"

                                            className={
                                                styles.stopButton
                                            }

                                            onClick={
                                                handleStop
                                            }
                                        >
                                            Остановить импорт
                                        </button>

                                    )
                                }


                                {
                                    bulkPhase === "paused" &&
                                    (

                                        <button
                                            type="button"

                                            className={
                                                styles.submit
                                            }

                                            onClick={
                                                handleResume
                                            }
                                        >
                                            Продолжить импорт
                                        </button>

                                    )
                                }


                                {
                                    [
                                        "completed",
                                        "error",
                                        "paused"
                                    ].includes(
                                        bulkPhase
                                    ) &&
                                    (

                                        <button
                                            type="button"

                                            className={
                                                styles.secondaryButton
                                            }

                                            onClick={
                                                onClose
                                            }
                                        >
                                            Закрыть
                                        </button>

                                    )
                                }

                            </div>

                        </div>

                    )
                }

            </div>

        </div>

    );
}
