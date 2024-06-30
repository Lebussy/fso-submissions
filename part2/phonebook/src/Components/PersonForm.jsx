import { useState } from "react"

const PersonForm = ({setPersons, persons, newName, setNewName, newNumber, setNewNumber, handleNewName, handleNewNumber}) => {

  // Handles adding a new person to the phonebook
  const addNewPerson = (event) => {
    event.preventDefault()
    // Checks if the name is already in the phone book and sends alert to the window
    if (persons.some((person) => person.name === newName)){
      window.alert(`${newName} is already added to the phonebook`)
      return
    }
    const newPersonObject = {
      name: newName,
      number: newNumber
    }
    setPersons(persons.concat(newPersonObject))
  }

  return(
    <>
    <h2>add a new</h2>
    <form onSubmit={addNewPerson}>
        <div>
          name: <input value={newName} onChange={handleNewName}/>
        </div>
        <div>
          number: <input value={newNumber} onChange={handleNewNumber} type='number'/>
        </div>
        <div>
          <button type="submit">add</button>
        </div>
      </form>
      </>
  )
}

export default PersonForm