const app = require('../app')
const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const Blog = require('../models/blog')
const helper = require('./test_helper')
const User = require('../models/user')
const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')

const api = supertest(app)

describe('When the database has one user added', () => {
  beforeEach(async () => {
    // This method deletes all the users in the collection maching the query
    await User.deleteMany({})
    const { username, name, password } = helper.initialUser
    // Created the hash of the password to store in the db
    const passwordHash = await bcryptjs.hash(password, 10)

    const user = new User({
      username, 
      name,
      passwordHash,
    })

    await user.save()
  })

  test('adding a user with a fresh username succeeds', async () => {
    const newUser = {
      username:"frshuser",
      name:"testname",
      password:"Strongp4ssw0r!d"
    }
    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const users = await helper.usersInDb()
    const usernames = users.map(user => user.username)
    assert(usernames.includes(newUser.username))
  })

  test('adding a user with a duplicate username returns 400 and error message', async () => {
    const { username } = helper.initialUser
    const user = {
      username,
      password:"superStrongpassword",
      name:"thistestyname"
    }

    const response = await api
      .post('/api/users')
      .send(user)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const errorMessage = response.body.error
    assert(errorMessage.includes('username must be unique'))
  })

  test('adding a user without a password fails, returns 400 and correct message', async () => {
    const user = {
      username: 'uniqu3username', 
      name: 'nameyly'
    }

    const response = await api
      .post('/api/users')
      .send(user)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert(response.body.error === 'password required')

    const users = await User.find({})
    const usernames = users.map(user => user.username)

    assert(usernames.includes('groot'))
    assert(!usernames.includes('uniqu3username'))
  })

  test('adding a user with a weak password fails. returns 400 and correct error message', async () => {
    const user = {
      username: 'uniqu3username', 
      name: 'nameyly',
      password: 'vwk'
    }

    const response = await api
      .post('/api/users')
      .send(user)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert(response.body.error === 'password too weak, try again')

    const users = await User.find({})
    const usernames = users.map(user => user.username)

    assert(usernames.includes('groot'))
    assert(!usernames.includes('uniqu3username'))
  })

})

describe('when the database is reset with some blogs added', () => {

  beforeEach(async() => {
    await Blog.deleteMany({})
    const promiseArray = helper.initialBlogs.map(blog => new Blog(blog).save())
    await Promise.all(promiseArray)
  })

  test('blogs returned as json', async () => {
    await api.get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('correct number of blogs returned', async () => {
    const response = await api.get('/api/blogs')
    assert(response.body.length === helper.initialBlogs.length)
  })

  test('returned blogs have "id" property', async () => {
    const response = await api.get('/api/blogs')
    assert(response.body[0].id)
  })

  describe('when adding a blog', () => {

    test('adding a blog increases number of blogs in the db', async () => {
      await api.post('/api/blogs')
        .send(helper.blogToAdd)

      const blogsInDB = await helper.blogsInDB()

      assert.strictEqual(blogsInDB.length, helper.initialBlogs.length + 1)
    })

    test('the contents of the added blog are in the database', async () => {
      const blogToAdd = helper.blogToAdd
    
      await api.post('/api/blogs')
        .send(blogToAdd)
        .expect(201)
        .expect('Content-Type', /application\/json/)
      
      const blogsInDB = await helper.blogsInDB()
      const blogContents = blogsInDB.map(blog => blog.content)
      assert(blogContents.includes(blogToAdd.content))
    })

    test('likes property defaulted to zero if missing', async () => {
      const blogToAdd = {
        title: "Blog added in test",
        author: "foody mc bar",
        url: "http://www.wikileaks.com"
      }

      const response = await api.post('/api/blogs')
       .send(blogToAdd)
     const addedBlog = response.body
     assert.strictEqual(addedBlog.likes, 0)
    })

    test('blogs added have id property', async () => {
      const blogs = await helper.blogsInDB()
      assert(blogs[0].id)
    })

    test('blogs added with missing title returns 400 bad request', async () => {
      const blogToAdd = {
        author: "foody mc bar",
        url: "http://www.wikileaks.com",
        likes: 17
      }
    
      await api.post('/api/blogs')
        .send(blogToAdd)
        .expect(400)
    })

    test('blogs added with missing url return 400 bad request', async () => {
      const blogToAdd = {
        title: "Blog added in test",
        author: "foody mc bar",
        likes: 17
      }

      await api.post('/api/blogs')
        .send(blogToAdd)
        .expect(400)
    })
  })

  describe('deletion of a blog',  () => {
    test('succeeds when the id is valid', async () => {
      const allBlogs = await helper.blogsInDB()
      const idOfFirstBlog = allBlogs[0].id

      await api.delete(`/api/blogs/${idOfFirstBlog}`)
        .expect(204)

      const blogsAfterDelete = await helper.blogsInDB()
      assert(blogsAfterDelete.length === helper.initialBlogs.length -1)
    })

    test('returns 400 bad request with invalid id', async () => {
      const invalidId = '1234'

      const error = await api.delete(`/api/blogs/${invalidId}`)
        .expect(400)
    })
  })

  describe('updating a blog', () => {
    test("succeeds in increasing the likes", async () => {
      const firstBlog = await helper.firstBlog()

      const updated = {
        title: firstBlog.title,
        url: firstBlog.url,
        likes: firstBlog.likes + 1,
        author:firstBlog.author
      }

      const response = await api
        .put(`/api/blogs/${firstBlog.id}`)
        .send(updated)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.likes, updated.likes)
    })

    test('with an invalid id returns status code 400 bad request', async () => {
      const invalidId = '1234'
      await api.put(`/api/blogs/${invalidId}`)
        .expect(400)
    })

  })
  
})

after(async () => {
  await mongoose.connection.close()
})