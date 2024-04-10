import React, { useState, useRef, useEffect } from 'react'
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, logout } from "../firebase";
import { doc, collection, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import './Pages.css'
import Loading from './Loading'

export default function Pages(props) {

    // Used variables within the web-app

    const [user] = useAuthState(auth);
    const [notes, setNotes] = useState([]);
    const inputTextareaRef = useRef(null);
    const userInfoRef = useRef(null);
    const styleRef = useRef(null);
    const [userDropdown, setUserDropdown] = useState(false);
    const [listDropdown, setListDropdown] = useState(false);
    const [showCheck, setShowCheck] = useState(false);
    const [nbClass, setNbClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [notification, setNotification] = useState({ show: false, msg: '', work: '' });
    const [noteToShow, setNoteToShow] = useState({ index: 0, name: '', content: '', isFav: false, isArch: false });
    const [newName, setNewName] = useState('');
    const [newContent, setNewContent] = useState('');
    const [cont, setCont] = useState('mainCont');
    const [view, setView] = useState('all');

    // This UseEffect will generate all the required data and then set the loading False

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const notesRef = collection(db, "notes", user.uid, "userNotes");
                const querySnapshot = await getDocs(notesRef);
                const fetchedNotes = querySnapshot.docs.map((doc) => doc.data()) || [];
                setNotes(fetchedNotes);
                setLoading(false);
                console.clear();
            } catch (error) {
                console.error(error);
                showNotification('error', 'Something went wrong! Please try again.');
            }
        };
        fetchNotes();
    }, [user]);

    // this function will change the pages of the web-app

    const handleContChange = (contr) => {
        setCont(contr)
    }

    // this function will reflect the Content of the Note when the user writes it

    const handleNewNameChange = (e) => {
        e.target.addEventListener('keyup', (ev) => {
            if (ev.key === "Enter" || ev.keyCode === 13) {
                ev.preventDefault();
                inputTextareaRef.current.focus()
            }
        });
        setNewName(e.target.value)
    }

    // this function will give the Name and the Content of the note to the NotePage when user opens a note

    const handleNote = (index) => {
        let ind = index;
        for (let i = 0; i < notes.length; i++) {
            if (notes[i].index === index) {
                index = i;
                break;
            }
        }
        const tempstore = { index: ind, name: notes[index].name, content: notes[index].content, isFav: notes[index].isFav, isArch: notes[index].isArch, date: notes[index].date }
        setNoteToShow(tempstore);
        handleContChange('notePage')
    }

    // this function will copy the content of the note

    const copyContent = () => {
        setShowCheck(true)
        navigator.clipboard.writeText(noteToShow.content)
        setTimeout(() => {
            setShowCheck(false)
        }, 1000);
    }

    // this function will show a notification when a task has been done

    const showNotification = (work, msg) => {
        let tempstore = { show: true, msg: msg, work: work }
        setNotification(tempstore)
        setTimeout(() => {
            setNbClass('op1');
        }, 500);
        setTimeout(() => {
            setNbClass('')
        }, 2500);
        setTimeout(() => {
            tempstore = { show: false, msg: msg, work: work }
            setNotification(tempstore)
        }, 3000);
    }

    // this function will add a new note in the Notes array and in the Firestore Database

    const handleAddNote = async () => {
        if (newContent.trim().length > 0 && newName.trim().length > 0) {      //checking if the name or the content of a note is filled properly or not
            const newNote = {
                index: notes.length === 0 ? 0 : (notes[notes.length - 1].index) + 1,
                name: newName,
                content: newContent,
                isFav: false,
                isArch: false,
                date: new Date()
            };
            try {
                const notesRef = collection(db, "notes", user.uid, "userNotes");
                const noteDocRef = doc(notesRef, `noteNum${notes.length === 0 ? 0 : (notes[notes.length - 1].index) + 1}`);
                await setDoc(noteDocRef, newNote);
                const updatedNotes = [...notes, newNote];
                handleContChange('mainCont')
                setNotes(updatedNotes);
                showNotification('done', 'Your Note has been added.')
                setNewName('')
                setNewContent('')
            } catch (er) {
                console.log(er)
                showNotification('error', 'Something went wrong. Please try adding the note again.');
            }
        }
    }

    // this function will update notes

    const handleUpdateNote = async (element) => {
        try {
            const noteRef = doc(db, "notes", user.uid, "userNotes", `noteNum${element.index}`);
            await updateDoc(noteRef, { index: element.index, name: element.name, content: element.content, isFav: element.isFav, isArch: element.isArch, date: element.date });
            return "successfull";
        } catch (error) {
            return "error";
        }
    }

    // this function will update if a note is in favourite or not

    const handleLikeChange = async (element) => {
        let index = element.index;
        for (let i = 0; i < notes.length; i++) {
            if (notes[i].index === index) {
                index = i;
                break;
            }
        }
        const updatedNotes = [...notes];
        const toggleLike = () => {
            updatedNotes[index].isFav = !updatedNotes[index].isFav;
            setNotes(updatedNotes);
            setNoteToShow(updatedNotes[index]);
        }
        toggleLike();
        handleUpdateNote(updatedNotes[index]).then(result => {
            if (result === "error") {
                toggleLike();
                showNotification('error', 'Something went wrong. Please try again.')
            }
        }).catch(error => {
            toggleLike();
            console.error(error);
            showNotification('error', 'Something went wrong. Please try again.')
        });
    }

    // this function will update if a note is in Archive or not

    const handleArchiveNote = async (element) => {
        let index = element.index;
        for (let i = 0; i < notes.length; i++) {
            if (notes[i].index === index) {
                index = i;
                break;
            }
        }
        const updatedNotes = [...notes];
        const toggleArchive = () => {
            updatedNotes[index].isArch = !updatedNotes[index].isArch;
            setNotes(updatedNotes);
            setNoteToShow(updatedNotes[index]);
        }
        toggleArchive();
        handleUpdateNote(updatedNotes[index]).then(result => {
            if (result === "error") {
                toggleArchive();
                showNotification('error', 'Something went wrong. Please try again.')
            }
        }).catch(error => {
            toggleArchive();
            console.error(error);
            showNotification('error', 'Something went wrong. Please try again.')
        });
    }

    // this function will delete a note from the array

    const handleDeleteNote = async (index) => {
        try {
            const notesRef = collection(db, "notes", user.uid, "userNotes");
            const noteDoc = doc(notesRef, `noteNum${index}`);
            await deleteDoc(noteDoc);
            for (let i = 0; i < notes.length; i++) {
                if (notes[i].index === index) {
                    index = i;
                    break;
                }
            }
            const updatedNotes = notes.filter((note, i) => i !== index);
            setNotes(updatedNotes);
            handleContChange('mainCont')
            showNotification('done', 'Note Deleted Successfully.')
        } catch (error) {
            console.error(error);
            showNotification('error', 'Something went wrong. Please try again.')
        }
    }

    //this function will set the update to true, meaning that the user is updating a note

    const handleUpdateChange = () => {
        setUpdating(true)
        setNewName(noteToShow.name)
        setNewContent(noteToShow.content)
        setCont('newCont')
    }

    // This funtion will save the updates in notes array and in the Firestore Database

    const saveUpdate = () => {
        let index = noteToShow.index;
        if (newName.trim().length > 0 && newContent.trim().length > 0) {
            const tempstore = { index: noteToShow.index, name: newName, content: newContent, isFav: noteToShow.isFav, isArch: noteToShow.isArch, date: noteToShow.date }
            handleUpdateNote(tempstore).then(result => {
                if (result === "error") {
                    showNotification('error', 'Something went wrong. Please try again.')
                }
                else {
                    for (let i = 0; i < notes.length; i++) {
                        if (notes[i].index === index) {
                            index = i;
                            break;
                        }
                    }
                    const updatedNotes = [...notes]
                    updatedNotes[index] = tempstore;
                    setNotes(updatedNotes);
                    handleContChange('mainCont');
                    showNotification('done', 'Note Updated Successfully')
                    setNewName('');
                    setNewContent('');
                    setUpdating(false);
                }
            }).catch(error => {
                console.error(error);
                showNotification('error', 'Something went wrong. Please try again.')
            });
        }
    }

    // Function to hide tooltip when the user click elsewhere

    const handleTooltipShow = (e) => {
        if (e.target !== userInfoRef.current && userDropdown === true) {
            setUserDropdown(false);
        }
        if (e.target !== styleRef.current && listDropdown === true) {
            setListDropdown(false);
        }
    }

    // Note Tile Container

    const Notetile = (props) => {
        return (
            <div id="noteTile">
                <div id="NTLeftSide" onClick={() => handleNote(props.element.index)}>
                    <div id="NTNotesName">{props.element.name}</div>
                </div>
                <div id="NTNoteOptions">
                    <div id="NTLikeNote" onClick={() => handleLikeChange(props.element)}>
                        {
                            props.element.isFav === true ?
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-heart-fill"
                                    viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z" />
                                </svg>
                                :
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-heart"
                                    viewBox="0 0 16 16">
                                    <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z" />
                                </svg>
                        }
                    </div>
                    <div id="NTArchiveNote" onClick={() => handleArchiveNote(props.element)}>
                        {
                            props.element.isArch === false ?
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-archive" viewBox="0 0 16 16">
                                    <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                </svg>
                                :
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-archive-fill" viewBox="0 0 16 16">
                                    <path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15h9.286zM5.5 7h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1zM.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8H.8z" />
                                </svg>
                        }
                    </div>
                    <div id="NTDeleteNote" onClick={() => handleDeleteNote(props.element.index)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z" />
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z" />
                        </svg>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div id='Pages'>
            {
                loading ?
                    <Loading />
                    :
                    <>
                        {
                            cont === 'mainCont' ?
                                <div id="container" onClick={handleTooltipShow}>
                                    <div id="headerCont">
                                        <div id="cont">
                                            <div id="appInfo">
                                                <div className="appLogo" title={props.Title}><img className='showToolTip' src={props.logo} alt="logo" /></div>
                                                <h1 id="appName">{props.Title}</h1>
                                            </div>
                                            <div id="headerOptions">
                                                <div className="btn" id='addNote' title='Add a note' onClick={() => handleContChange('newCont')}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                                    </svg>
                                                </div>
                                                <div id="userInfo" onClick={() => setUserDropdown(!userDropdown)}>
                                                    <img ref={userInfoRef} src={user.photoURL} alt={user.displayName} />
                                                    {
                                                        userDropdown === true ?
                                                            <div id="userOption">
                                                                <div id="userName">{user.displayName}</div>
                                                                <div id="userEmail">{user.email}</div>
                                                                <div id="totalNotes">Total Notes : {notes.length}</div>
                                                                <button id="logout" onClick={logout}>Logout</button>
                                                            </div> : ''
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="bodyCont">
                                        <div className='btn' id='floatingAddBtn' title='Add a note' onClick={() => handleContChange('newCont')}>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                            </svg>
                                        </div>
                                        {
                                            notes.length === 0 ?
                                                null
                                                :
                                                <div id="neckCont">
                                                    <h3 id="notesHead">Your Notes :</h3>
                                                    <div id="bodyHeadOptions" className="btn showToolTip" onClick={() => setListDropdown(!listDropdown)}>
                                                        {
                                                            view === 'sort' ?
                                                                <svg ref={styleRef} xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-sort-alpha-down" viewBox="0 0 16 16">
                                                                    <path fillRule="evenodd" d="M10.082 5.629 9.664 7H8.598l1.789-5.332h1.234L13.402 7h-1.12l-.419-1.371h-1.781zm1.57-.785L11 2.687h-.047l-.652 2.157h1.351z" />
                                                                    <path d="M12.96 14H9.028v-.691l2.579-3.72v-.054H9.098v-.867h3.785v.691l-2.567 3.72v.054h2.645V14zM4.5 2.5a.5.5 0 0 0-1 0v9.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L4.5 12.293V2.5z" />
                                                                </svg> :
                                                                view === 'fav' ?
                                                                    <svg ref={styleRef} xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-heart"
                                                                        viewBox="0 0 16 16">
                                                                        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z" />
                                                                    </svg>
                                                                    :
                                                                    view === 'archive' ?
                                                                        <svg ref={styleRef} xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-archive" viewBox="0 0 16 16">
                                                                            <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                                                        </svg>
                                                                        :
                                                                        <svg ref={styleRef} xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-columns-gap" viewBox="0 0 16 16">
                                                                            <path d="M6 1v3H1V1h5zM1 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm14 12v3h-5v-3h5zm-5-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5zM6 8v7H1V8h5zM1 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1zm14-6v7h-5V1h5zm-5-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-5z" />
                                                                        </svg>
                                                        }
                                                    </div>
                                                    {
                                                        listDropdown === true ?
                                                            <div id="listDropdown" onClick={() => setListDropdown(!listDropdown)}>
                                                                <div id="list-sort" className='listDD' onClick={() => setView('sort')}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-sort-alpha-down" viewBox="0 0 16 16">
                                                                        <path fillRule="evenodd" d="M10.082 5.629 9.664 7H8.598l1.789-5.332h1.234L13.402 7h-1.12l-.419-1.371h-1.781zm1.57-.785L11 2.687h-.047l-.652 2.157h1.351z" />
                                                                        <path d="M12.96 14H9.028v-.691l2.579-3.72v-.054H9.098v-.867h3.785v.691l-2.567 3.72v.054h2.645V14zM4.5 2.5a.5.5 0 0 0-1 0v9.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L4.5 12.293V2.5z" />
                                                                    </svg>
                                                                    Sort
                                                                </div>
                                                                <div id="list-fav" className='listDD' onClick={() => setView('fav')}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-heart"
                                                                        viewBox="0 0 16 16">
                                                                        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z" />
                                                                    </svg>
                                                                    Favourite
                                                                </div>
                                                                <div id="list-archive" className='listDD' onClick={() => setView('archive')}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-archive" viewBox="0 0 16 16">
                                                                        <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                                                    </svg>
                                                                    Archived
                                                                </div>
                                                                <div id="list-default" className='listDD' onClick={() => setView('all')}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-columns-gap" viewBox="0 0 16 16">
                                                                        <path d="M6 1v3H1V1h5zM1 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm14 12v3h-5v-3h5zm-5-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5zM6 8v7H1V8h5zM1 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1zm14-6v7h-5V1h5zm-5-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-5z" />
                                                                    </svg>
                                                                    Default
                                                                </div>
                                                            </div> : null
                                                    }
                                                </div>
                                        }
                                        <div id="notesCont">
                                            {
                                                notes.length === 0 ?
                                                    <div id="createNotesCont">
                                                        <svg xmlns="http://www.w3.org/2000/svg" onClick={() => handleContChange('newCont')} fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                                                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                                        </svg>
                                                        <h3>Cick on the
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                                                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                                            </svg>
                                                            icon to Create a New note.</h3>
                                                    </div>
                                                    :
                                                    <div id="noteTilesCont">
                                                        {
                                                            view === 'all' ?
                                                                notes.filter((el) => el.isArch === false).sort((a, b) => b.date - a.date).map((element, index) => {
                                                                    return (
                                                                        <Notetile key={index} element={element} index={element.index} />
                                                                    )
                                                                }) :
                                                                view === 'sort' ?
                                                                    notes.filter((el) => el.isArch === false).sort((a, b) => a.name.localeCompare(b.name)).map((element, index) => {
                                                                        return (
                                                                            <Notetile key={index} element={element} index={element.index} />
                                                                        )
                                                                    })
                                                                    :
                                                                    view === 'fav' ?
                                                                        notes.filter((el) => el.isFav === true).map((element, index) => {
                                                                            return (
                                                                                <Notetile key={index} element={element} index={element.index} />
                                                                            )
                                                                        }) :
                                                                        view === 'archive' ?
                                                                            notes.filter((el) => el.isArch === true).map((element, index) => {
                                                                                return (
                                                                                    <Notetile key={index} element={element} index={element.index} />
                                                                                )
                                                                            }) : null
                                                        }
                                                    </div>
                                            }
                                        </div>
                                        <div id="contFooter">
                                            <div id="innerContFooter">
                                                <p>Designed & Developed by <a href="https://www.linkedin.com/in/sadiq-naqvi-327892238" rel="noreferrer" target='_blank'>Sadiq Naqvi</a></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                :
                                cont === 'newCont' ?
                                    <div id="newNoteCont">
                                        <div id="NNHeader">
                                            <div id="NNLeftSide">
                                                <div className="appLogo"><img src={props.logo} alt="logo" /></div>
                                                <input type="text" autoFocus id="noteNameInput" value={newName} placeholder='Name this note....' onChange={handleNewNameChange} />
                                            </div>
                                            <button id="closeNewNote" className='icon' onClick={() => handleContChange('mainCont')}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
                                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div id="NNBody">
                                            <textarea ref={inputTextareaRef} id="newNoteInput" placeholder='Note here...' value={newContent} onChange={e => setNewContent(e.target.value)}></textarea>
                                        </div>
                                        <div id="NNFooter">
                                            <div className="wordCounter">
                                                <span className="LetterBox">Letters : {newContent.trim().length}</span>
                                                <span className="wordBox">Words : {newContent.trim().length === 0 ? 0 : newContent.trim().split(/\s+/).length}</span>
                                            </div>
                                            <button id="saveNewInput" className='btn' onClick={updating === true ? saveUpdate : handleAddNote}>Save</button>
                                        </div>
                                    </div>
                                    :
                                    cont === 'notePage' &&
                                    <div id='notePage'>
                                        <div id="NPHeader">
                                            <div id="NPLeftSide">
                                                <div className="appLogo" onClick={logout} ><img src={props.logo} alt="logo" /></div>
                                                <div id="NPNoteName">{noteToShow.name}</div>
                                            </div>
                                            <div id="NPRightSide">
                                                <button id="closeNote" className='icon' onClick={() => handleContChange('mainCont')}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
                                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div id="NPBody">{noteToShow.content}</div>
                                        <div id="NPFooter">
                                            <div id="NPFLeftSide">
                                                <div className="wordCounter">
                                                    <span className="letterBox">Letters : {noteToShow.content.trim().length}</span>
                                                    <span className="wordBox">Words : {noteToShow.content.trim().length === 0 ? 0 : noteToShow.content.trim().split(/\s+/).length}</span>
                                                </div>
                                            </div>
                                            <div id="NPFRightSide">
                                                <button id="copyNote" className="icon" onClick={copyContent}>
                                                    {
                                                        showCheck === false ?
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                                                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                                            </svg>
                                                            :
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-clipboard-check" viewBox="0 0 16 16">
                                                                <path fillRule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                                                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                                                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                                            </svg>

                                                    }
                                                </button>
                                                <button id="editNote" className="icon" onClick={handleUpdateChange} >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="bi bi-pen" viewBox="0 0 16 16">
                                                        <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001zm-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708l-1.585-1.585z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                        }
                        {
                            notification.show &&
                            <div id="notificationBox" className={nbClass}>
                                {
                                    notification.work === 'done' ?
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="green" className="bi bi-check2-circle" viewBox="0 0 16 16">
                                            <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0z" />
                                            <path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z" />
                                        </svg>
                                        :
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="red" className="bi bi-x" viewBox="0 0 16 16">
                                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                        </svg>
                                }
                                <p style={notification.work === 'done' ? { color: 'green' } : { color: 'red' }}>{notification.msg}</p>
                            </div>
                        }
                    </>
            }
        </div>
    )
}
