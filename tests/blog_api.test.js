const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')

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

afterAll(() => {
  mongoose.connection.close()
})