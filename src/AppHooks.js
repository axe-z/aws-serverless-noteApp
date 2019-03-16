import React,{ useState,useEffect } from 'react';
import { API,graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react'; //genre de Auth en withRouter
import { createNote,deleteNote,updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { onCreateNote,onDeleteNote,onUpdateNote } from './graphql/subscriptions';

const App = () => {

	const [id,setId] = useState("")
	const [note,setNote] = useState("")
	const [notes,setNotes] = useState([])

	useEffect(() => {

		getNotes();

		const createNoteListener = API.graphql(graphqlOperation(onCreateNote)).subscribe({
			next: (leDataNote) => {

				const newNote = leDataNote.value.data.onCreateNote;

				// setNotes(prevNotes => { //on a acces a prev.
				// 	const oldNotes = prevNotes.filter(note => note.id !== newNote.id)
				// 	const updatedNotes = [...oldNotes, newNote]
				// 	return updatedNotes //et pour setter , on donne un return stat.
				// });

				//j aurais fait moi  et c est mieux..
				setNotes(prevNotes => [...prevNotes,newNote]); //[newNote, ...prevNotes  ] si nouvelle en premier
				setNote("")
			}
		});

		const deleteNoteListener = API.graphql(graphqlOperation(onDeleteNote)).subscribe({
			next: (leDataNote) => {

				const newNoteDelete = leDataNote.value.data.onDeleteNote;

				// setNotes(prevNotes => { //on a acces a prev.
				// 	const updatedNotes = prevNotes.filter(note => note.id !== newNoteDelete.id)
				// 	return updatedNotes //et pour setter , on donne un return stat.
				// });

				//j aurais fait et c est mieux..
				setNotes(prevNotes => prevNotes.filter(note => note.id !== newNoteDelete.id));
			}
		});

		const onUpdateNoteListener = API.graphql(graphqlOperation(onUpdateNote)).subscribe({
			next: (leDataNote) => {

				const updatedNote = leDataNote.value.data.onUpdateNote;

				setNotes(prevNotes => { //on a acces a prev.
					const index = prevNotes.findIndex((note) => note.id === updatedNote.id);
					const updatedNotes = [
						...prevNotes.slice(0,index),  //faut prendre prevNotes
						updatedNote,
						...prevNotes.slice(index + 1) //faut prendre prevNotes
					];
					return updatedNotes
				});
				setNote("");
				setId("");
			}
		});
		//genre de unmount
		return () => {
			createNoteListener.unsubscribe();
			deleteNoteListener.unsubscribe();
			onUpdateNoteListener.unsubscribe();
		}
	},[]) //part au mount


	const getNotes = async () => {
		const result = await API.graphql(graphqlOperation(listNotes));
		setNotes(result.data.listNotes.items)
	}

	const handleChangeNote = (e) => setNote(e.target.value)

	const hasNoteExistante = () => {
		// const { notes,id } = this.state;
		if (id) {
			//is valid ? ici on veut pas l id mais un true false, donc on ajoute > -1
			const isNote = notes.findIndex(note => note.id === id) > -1
			return isNote
		}
		return false
	}

	const handleAddNote = async (e) => {
		e.preventDefault()
		if (hasNoteExistante()) {
			handleUpdateNote()
		} else {
			const input = { note }

			await API.graphql(graphqlOperation(createNote,{ input }));
		}
	}

	const handleDelete = async (noteId) => {
		await API.graphql(graphqlOperation(deleteNote,{ input: { id: noteId } }));
	}

	const handleUpdateNote = async () => {
		await API.graphql(graphqlOperation(updateNote,{ input: { id,note } }));
		setNote("")
	}

	const handleSetNote = ({ note,id }) => {
		setNote(note)
		setId(id)
	}

	return (
		<div className="flex flex-column items-center justify-center pa3 bg-washed-red">
			<h1 className="code f3-l">Notes Amplify - axe-z</h1>
			<form action="" className="mb3" onSubmit={handleAddNote}>
				<input type="text"
					onChange={handleChangeNote}
					className="pa2 f4"
					placeholder="votre note"
					value={note} />
				<button className="pa2 f4" type="submit">{id ? 'modifier' : 'save'}</button>
			</form>

			<div>
				{notes.map(note => (
					<div key={note.id}>
						<div className="flex items-center">
							<li onClick={() => handleSetNote(note)} className=" list pa1 f3" style={{ cursor: 'pointer' }} >{note.note}</li>
							<button className="bg-transparent bn f4" onClick={() => handleDelete(note.id)}><span>&times;</span></button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}


export default withAuthenticator(App,{ includeGreetings: true });

