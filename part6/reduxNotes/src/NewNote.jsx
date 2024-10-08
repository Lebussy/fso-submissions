import { useDispatch } from "react-redux";
import { createNote } from "./reducers/noteReducer";
import noteService from './services/notes'

const NewNote = () => {
  const dispatch = useDispatch()

  const addNote = async event => {
    event.preventDefault()
    const content = event.target.note.value
    event.target.note.value = ''
    dispatch(createNote(content))
  }

  return (
    <form onSubmit={addNote}>
      <input type="text" name="note"/>
      <button type="submit">Save</button>
    </form>
  )
}

export default NewNote