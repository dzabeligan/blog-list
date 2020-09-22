const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('unique identifier is defined as id and not _id', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body[0].id).toBeDefined()
    expect(response.body[0]._id).not.toBeDefined()
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')

    const titles = response.body.map(blog => blog.title)
    expect(titles).toContain('React patterns')
  })
})

describe('addition of a new blog', () => {
  test('a valid note can be added', async () => {
    const newBlog = {
      title: 'A New Blog on React',
      author: 'Dza Beligan',
      url: 'https://anewblogonreact.com/',
      likes: 20,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContain('A New Blog on React')
  })

  test('blog without likes property is set to zero', async () => {
    const newBlog = {
      title: 'A New Blog on React',
      author: 'Dza Beligan',
      url: 'https://anewblogonreact.com/',
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const newBlogLength = helper.initialBlogs.length + 1
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(newBlogLength)

    const likesOfNewBlog = blogsAtEnd.map(blog => blog.likes)[newBlogLength - 1]
    expect(likesOfNewBlog).toBe(0)
  })

  test('blog without title is not added', async () => {
    const newBlog = {
      author: 'Dza Beligan',
      url: 'https://anewblogonreact.com/',
      likes: 20,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('blog without url is not added', async () => {
    const newBlog = {
      title: 'A New Blog on React',
      author: 'Dza Beligan',
      likes: 20,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('updating a blog', () => {
  test('blog with a valid id and has not been deleted updates', async () => {
    const blogToUpdate = {
      title: 'A New Blog on React',
      author: 'Dza Beligan',
      url: 'https://anewblogonreact.com/',
      likes: 20,
    }

    const blogsAtStart = await helper.blogsInDb()
    await api
      .put(`/api/blogs/${blogsAtStart[0].id}`)
      .send(blogToUpdate)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContain('A New Blog on React')
  })

  test('blog with a non existing valid id does not update', async () => {
    const blogToUpdate = {
      title: 'A New Blog on React',
      author: 'Dza Beligan',
      url: 'https://anewblogonreact.com/',
      likes: 20,
    }

    const id = await helper.nonExistingId()

    await api
      .put(`/api/blogs/${id}`)
      .send(blogToUpdate)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain('A New Blog on React')
  })
})

describe('deleting a blog', () => {
  test('blog with a valid id and has not been deleted deletes', async () => {
    const blogsAtStart = await helper.blogsInDb()
    await api
      .delete(`/api/blogs/${blogsAtStart[0].id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
  })

  test('blog with a non existing valid id does, redundant delete', async () => {
    const id = await helper.nonExistingId()

    await api
      .delete(`/api/blogs/${id}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('User model', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const user = new User({ username: 'username', password: 'password' })
    const user2 = new User({ username: 'root', password: 'sekret' })
    await user.save()
    await user2.save()
  })

  describe('getting users', () => {
    test('users are returned as json', async () => {
      await api
        .get('/api/users')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('there are two users', async () => {
      const response = await api.get('/api/users')
      expect(response.body).toHaveLength(2)
    })

    test('the unique identifier property of the user is named id', async () => {
      const response = await api.get('/api/users')
      expect(response.body[0].id).toBeDefined()
    })
  })

  describe('creating users', () => {
    test('creating user succeeds with a new username', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'dzabeligan',
        name: 'Elijah Balogun',
        password: 'testthepassword',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

      const usernames = usersAtEnd.map(user => user.username)
      expect(usernames).toContain(newUser.username)
    })

    test('creating user fails if username exists', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'root',
        name: 'Iam Root',
        password: 'thisdoesnotmatter',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('`username` to be unique')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creating user fails if username is less than 3 characters long', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'dn',
        name: 'Elijah Balogun',
        password: 'testthepassword',
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('is shorter than the minimum allowed length (3)')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails if password is less than 3 characters long', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
        username: 'dzabeligan',
        name: 'Elijah Balogun',
        password: 'td',
      }

      await api
        .post('/api/users')
        .send(newUser)
        .expect(400)

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
  })
})

afterAll(() => {
  mongoose.connection.close()
})