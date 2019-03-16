import React,{ Component } from 'react';
import { API,graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react'; //genre de Auth en withRouter
import { createNote,deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions';

class App extends Component {
  state = {
    id: '',
    note: '',
    notes: []
  }
  handleChangeNote = (e) => this.setState({ note: e.target.value })


  componentDidMount = async () => {

  this.getNotes();

  this.createNoteListener = API.graphql(graphqlOperation(onCreateNote)).subscribe({
    next: (leDataNote) => {
      // console.log(leDataNote)
        //provider: AWSAppSyncProvider ...
        //value: {data: {…}, et dans le data y a notre nouvelle entree avec id et note.
        const newNote = leDataNote.value.data.onCreateNote;
        const prevNotes = this.state.notes.filter(note => note.id !== newNote.id )
        const updatedNotes = [...prevNotes, newNote];
        this.setState({ notes: updatedNotes, note: ''  })
    }
  });

  this.deleteNoteListener =  API.graphql(graphqlOperation(onDeleteNote)).subscribe({
    next: (leDataNote) => {
      // console.log(leDataNote)
        //provider: AWSAppSyncProvider ...
        //value: {data: {…}, et dans le data y a notre nouvelle entree avec id et note.
        const newNoteDelete = leDataNote.value.data.onDeleteNote;
        const updatedNotes = this.state.notes.filter((note) => note.id !== newNoteDelete.id)
        this.setState({ notes: updatedNotes })
    }
  });

  this.onUpdateNoteListener = API.graphql(graphqlOperation(onUpdateNote)).subscribe({
    next: (leDataNote) => {
      // console.log(leDataNote)
        //provider: AWSAppSyncProvider ...
        //value: {data: {…}, et dans le data y a notre nouvelle entree avec id et note.
        const { notes } = this.state;
        const updatedNote = leDataNote.value.data.onUpdateNote;
        const index = notes.findIndex( (note) => note.id === updatedNote.id )

        const updatedNotes = [
          ...notes.slice(0, index),  //retourne un array moins lui qu on update , donc spread en object individuels
           updatedNote,
          ...notes.slice(index + 1) //pas mettre un deuxieme argument, rammasse tout ce qui est apres.
        ]
        //console.log(updatedNotes)
        this.setState({ notes: updatedNotes,note: '' })
    }
  });
  }

  componentWillUnmount() {
    this.createNoteListener.unsubscribe();
    this.deleteNoteListener.unsubscribe();
    this.onUpdateNoteListener.unsubscribe();
  }


  getNotes = async() => {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items })
  }

  hasNoteExistante = () => {
    const { notes,id } = this.state;
    if (id) {
      //is valid ? ici on veut pas l id mais un true false, donc on ajoute > -1
      const isNote = notes.findIndex(note => note.id === id) > -1
      return isNote
    }
    return false
  }

  handleAddNote = async (e) => {
    e.preventDefault()
    const { note  } = this.state;
    const input = { note: note } //meme nom donc on pourrait shorter ca

    ///verifier si nouvelle note ou un update :
    if (this.hasNoteExistante()) {
      // console.log('oui')
      this.handleUpdateNote()

    } else {
      //API.graphql(graphqlOperation(createNote, {input: { note: note} }))
      // const result = await API.graphql(graphqlOperation(createNote,{ input }));
       await API.graphql(graphqlOperation(createNote,{ input }));

      // //  console.log(result.data.createNote)
      // const newNote = result.data.createNote; //le data, obj { id:fjewoijfioew, note: "faire la paix"}
      // const updatedNotes = [newNote,...notes] //creer une nouvelle array en extendant
      // this.setState({ notes: updatedNotes,note: '' }) //update note sans domager, et reseter le input
      this.setState({ note: '' })
    }
  }

  handleDelete = async (noteId) => {
    // e.preventDefault()
    // const { notes } = this.state;


    //API.graphql(graphqlOperation(createNote, {input: { note: note} }))
    // const result = await API.graphql(graphqlOperation(deleteNote,{ input: { id: noteId } }));

 //apres sub
     await API.graphql(graphqlOperation(deleteNote,{ input: { id: noteId } }));

    //pour rafraichir le ui directement
    // const deletedNoteId = result.data.deleteNote.id;
    // const updatedNotes = notes.filter((note) => note.id !== deletedNoteId)
    // this.setState({ notes: updatedNotes })
  }

  //recoit l item ( qui a note et id )
  handleSetNote = ({ note,id }) => this.setState({ note,id });

  handleUpdateNote = async() => {
    const {   note ,id } = this.state;


    // const result = await API.graphql(graphqlOperation(updateNote,{ input: { id, note } }));.
    //APRES SUB
      await API.graphql(graphqlOperation(updateNote,{ input: { id, note } }));

    // const updatedNote = result.data.updateNote;  //console.log(updatedNote)
//maintenant pour enregistrer l update au meme endroit qu avant:
    // const index = notes.findIndex( (note) => note.id === updatedNote.id )
    //remplacer en gardant les positions:
    //1-prendre du debut jusqu a lindex ( non inclut )
    //2-ajouter le nouveau a son index precedent
    //3-ajouter ce qui etait apres l index. pour refaire un array qui garde les ordres mais est modifier.
    // const updatedNotes = [
    //   ...notes.slice(0, index),  //retourne un array moins lui qu on update , donc spread en object individuels
    //    updatedNote,
    //   ...notes.slice(index + 1) //pas mettre un deuxieme argument, rammasse tout ce qui est apres.
    // ]
    //console.log(updatedNotes)
    // this.setState({ notes: updatedNotes,note: '' })
    this.setState({  note: '' })

  }

  render () {
    const { note,notes } = this.state;
    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f3-l">Notes Amplify - axe-z</h1>
        <form action="" className="mb3" onSubmit={this.handleAddNote}>
          <input type="text"
            onChange={this.handleChangeNote}
            className="pa2 f4"
            placeholder="votre note"
            value={note} />
          <button className="pa2 f4" type="submit">{this.state.id ? 'modifier' : 'save'}</button>
        </form>

        <div>
          {notes.map(note => (
            <div key={note.id}>
              <div className="flex items-center">
                <li onClick={() => this.handleSetNote(note)} className=" list pa1 f3" style={{ cursor: 'pointer' }} >{note.note}</li>
                <button className="bg-transparent bn f4" onClick={() => this.handleDelete(note.id)}><span>&times;</span></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default withAuthenticator(App,{ includeGreetings: true });

